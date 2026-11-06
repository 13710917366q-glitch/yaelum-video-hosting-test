param([string]$Base='https://yaelum-video-guard.yaelum-video-guard.workers.dev')
$ErrorActionPreference='Stop'
$handler=[Net.Http.HttpClientHandler]::new()
$handler.Proxy=[Net.WebProxy]::new('http://127.0.0.1:7890')
$handler.UseProxy=$true
$client=[Net.Http.HttpClient]::new($handler)
$client.Timeout=[TimeSpan]::FromSeconds(30)
$results=[Collections.Generic.List[object]]::new()
function Check-Request($method,$path,$expected,$range='') {
  $request=[Net.Http.HttpRequestMessage]::new([Net.Http.HttpMethod]::new($method),$Base+$path)
  if($range){$null=$request.Headers.TryAddWithoutValidation('Range',$range)}
  $watch=[Diagnostics.Stopwatch]::StartNew()
  $response=$client.SendAsync($request).GetAwaiter().GetResult()
  $body=$response.Content.ReadAsByteArrayAsync().GetAwaiter().GetResult()
  if([int]$response.StatusCode -ne $expected){throw "$method $path : $([int]$response.StatusCode) expected $expected"}
  $entry=[ordered]@{method=$method;path=$path;range=$range;status=[int]$response.StatusCode;ms=$watch.ElapsedMilliseconds;contentLength=$response.Content.Headers.ContentLength;contentRange=[string]$response.Content.Headers.ContentRange;received=$body.Length}
  $results.Add($entry)
  return @{response=$response;body=$body}
}
try {
  $health=Check-Request GET '/health' 200
  $enabled=[Text.Encoding]::UTF8.GetString($health.body) | ConvertFrom-Json
  if(-not $enabled.enabled){throw 'Live Worker disabled'}
  $manifest=Get-Content -LiteralPath (Join-Path $PSScriptRoot 'video-manifest.json') -Raw | ConvertFrom-Json
  foreach($item in $manifest){
    $head=Check-Request HEAD ('/'+$item.name) 200
    if($head.response.Content.Headers.ContentLength -ne $item.bytes){throw ('Length mismatch: '+$item.name)}
    $prefix=Check-Request GET ('/'+$item.name) 206 'bytes=0-63'
    if([string]$prefix.response.Content.Headers.ContentRange -ne "bytes 0-63/$($item.bytes)"){throw 'Range header mismatch'}
    $stream=[IO.File]::OpenRead((Join-Path (Split-Path $PSScriptRoot) ('video/'+$item.name)))
    try {$local=[byte[]]::new(64);$null=$stream.Read($local,0,64)}finally{$stream.Dispose()}
    if([Convert]::ToHexString($local) -ne [Convert]::ToHexString($prefix.body)){throw ('Prefix mismatch: '+$item.name)}
    Write-Output ($item.name+' HEAD + Range verified')
  }
  foreach($name in @('cover4.mp4','intro.mp4')){
    $suffix=Check-Request GET ('/'+$name) 206 'bytes=-64'
    $stream=[IO.File]::OpenRead((Join-Path (Split-Path $PSScriptRoot) ('video/'+$name)))
    try {$null=$stream.Seek(-64,[IO.SeekOrigin]::End);$local=[byte[]]::new(64);$null=$stream.Read($local,0,64)}finally{$stream.Dispose()}
    if([Convert]::ToHexString($local) -ne [Convert]::ToHexString($suffix.body)){throw ('Suffix mismatch: '+$name)}
  }
  $null=Check-Request GET '/intro.mp4' 416 'bytes=999999999-'
  $null=Check-Request GET '/intro.mp4' 416 'bytes=0-2,8-10'
  $null=Check-Request GET '/unlisted.mp4' 404
  $null=Check-Request POST '/intro.mp4' 405
  $null=Check-Request OPTIONS '/intro.mp4' 204
  $null=Check-Request GET '/intro.mp4?bypass=1' 404
  $record=[ordered]@{at=[DateTime]::UtcNow.ToString('o');base=$Base;proxy='existing local proxy';passed=$true;checks=$results}
  [IO.File]::WriteAllText((Join-Path $PSScriptRoot 'live-probe.json'),(ConvertTo-Json -InputObject $record -Depth 8),[Text.UTF8Encoding]::new($false))
  Write-Output ('PASS '+$results.Count+' live checks')
} finally {$client.Dispose();$handler.Dispose()}
