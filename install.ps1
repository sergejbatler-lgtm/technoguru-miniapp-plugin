$pluginUrl = "https://github.com/sergejbatler-lgtm/technoguru-miniapp-plugin.git"
$claudeDir = "$env:USERPROFILE\.claude"
$pluginDir = "$claudeDir\plugins\cache\technoguru-marketplace\technoguru-miniapp\1.2.0"
$marketplaceDir = "$claudeDir\plugins\marketplaces\technoguru-marketplace"
$settingsFile = "$claudeDir\settings.json"
$claudeMd = "$claudeDir\CLAUDE.md"

New-Item -ItemType Directory -Force -Path $pluginDir | Out-Null
New-Item -ItemType Directory -Force -Path $marketplaceDir | Out-Null

if (Test-Path "$pluginDir\.git") {
    Push-Location $pluginDir; git pull 2>&1 | Out-Null; Pop-Location
} else {
    git clone $pluginUrl $pluginDir 2>&1 | Out-Null
}

if (Test-Path "$marketplaceDir\.git") {
    Push-Location $marketplaceDir; git pull 2>&1 | Out-Null; Pop-Location
} else {
    git clone $pluginUrl $marketplaceDir 2>&1 | Out-Null
}

$settings = @{}
if (Test-Path $settingsFile) {
    try { $settings = Get-Content $settingsFile -Raw -Encoding UTF8 | ConvertFrom-Json } catch {}
}
if (-not $settings.extraKnownMarketplaces) {
    $settings | Add-Member -NotePropertyName "extraKnownMarketplaces" -NotePropertyValue ([PSCustomObject]@{})
}
$settings.extraKnownMarketplaces | Add-Member -NotePropertyName "technoguru-marketplace" -NotePropertyValue ([PSCustomObject]@{
    source = [PSCustomObject]@{ source = "github"; repo = "sergejbatler-lgtm/technoguru-miniapp-plugin" }
}) -Force
if (-not $settings.enabledPlugins) {
    $settings | Add-Member -NotePropertyName "enabledPlugins" -NotePropertyValue ([PSCustomObject]@{})
}
$settings.enabledPlugins | Add-Member -NotePropertyName "technoguru-miniapp@technoguru-marketplace" -NotePropertyValue $true -Force
$settings | ConvertTo-Json -Depth 10 | Set-Content $settingsFile -Encoding UTF8

$line1 = "# TechnoGuru Plugin"
$line2 = "When user says mini-app or mini app or miniapp - read: $pluginDir\skills\miniapp-welcome\SKILL.md"
$line3 = "When user says deploy or zadeploy - read: $pluginDir\skills\deploy-vps\SKILL.md"
$line4 = "When user says afisha or events - read: $pluginDir\skills\miniapp-events\SKILL.md"
$line5 = "Core: $pluginDir\core\telegram-miniapp-fundamentals.md"

if (Test-Path $claudeMd) {
    $existing = Get-Content $claudeMd -Raw -Encoding UTF8
    if ($existing -notlike "*TechnoGuru Plugin*") {
        Add-Content $claudeMd "`n$line1`n$line2`n$line3`n$line4`n$line5" -Encoding UTF8
    }
} else {
    Set-Content $claudeMd "$line1`n$line2`n$line3`n$line4`n$line5" -Encoding UTF8
}

Write-Host "Done! Restart Claude Code and type: want mini-app"
