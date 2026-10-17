param([string[]]$Files)
# Prints the opaque-pixel bounding box of each PNG (alpha > 16) so sprites can share a feet baseline.
Add-Type -AssemblyName System.Drawing
$ErrorActionPreference='Stop'
foreach($f in $Files){
 $b=New-Object System.Drawing.Bitmap $f
 $minX=$b.Width;$minY=$b.Height;$maxX=-1;$maxY=-1
 for($y=0;$y -lt $b.Height;$y++){for($x=0;$x -lt $b.Width;$x++){if($b.GetPixel($x,$y).A -gt 16){if($x -lt $minX){$minX=$x};if($x -gt $maxX){$maxX=$x};if($y -lt $minY){$minY=$y};if($y -gt $maxY){$maxY=$y}}}}
 "{0}`t{1}x{2}`tx {3}-{4}`ty {5}-{6}`th {7}" -f (Split-Path $f -Leaf),$b.Width,$b.Height,$minX,$maxX,$minY,$maxY,($maxY-$minY+1)
 $b.Dispose()
}
