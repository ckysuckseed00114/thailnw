param([string[]]$Files,[string]$Out,[int]$Scale=4,[string]$Bg='#1b2233')
Add-Type -AssemblyName System.Drawing
$imgs=$Files|ForEach-Object{[System.Drawing.Image]::FromFile($_)}
$ErrorActionPreference='Stop'
[int]$w=($imgs|Measure-Object -Property Width -Sum).Sum*$Scale+($imgs.Count+1)*16
[int]$h=($imgs|Measure-Object -Property Height -Maximum).Maximum*$Scale+32
$bmp=New-Object System.Drawing.Bitmap $w,$h
$g=[System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode=[System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
$g.PixelOffsetMode=[System.Drawing.Drawing2D.PixelOffsetMode]::Half
$g.Clear([System.Drawing.ColorTranslator]::FromHtml($Bg))
$x=16;foreach($i in $imgs){$g.DrawImage($i,$x,16,$i.Width*$Scale,$i.Height*$Scale);$x+=$i.Width*$Scale+16}
$bmp.Save($Out,[System.Drawing.Imaging.ImageFormat]::Png);$g.Dispose();$bmp.Dispose();$imgs|ForEach-Object{$_.Dispose()}
"saved $Out ${w}x${h}"
