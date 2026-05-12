# TechnoGuru Miniapp Plugin — установка
# Запусти: powershell -ExecutionPolicy Bypass -File install.ps1

$pluginUrl = "https://github.com/sergejbatler-lgtm/technoguru-miniapp-plugin.git"
$claudeDir = "$env:USERPROFILE\.claude"
$pluginDir = "$claudeDir\plugins\cache\technoguru-marketplace\technoguru-miniapp\1.2.0"
$marketplaceDir = "$claudeDir\plugins\marketplaces\technoguru-marketplace"
$settingsFile = "$claudeDir\settings.json"
$claudeMd = "$claudeDir\CLAUDE.md"

Write-Host ""
Write-Host "TechnoGuru Miniapp Plugin — установка" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# 1. Создаём папки
Write-Host "1. Создаём папки..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path $pluginDir | Out-Null
New-Item -ItemType Directory -Force -Path $marketplaceDir | Out-Null

# 2. Клонируем или обновляем плагин в кэш
Write-Host "2. Скачиваем плагин с GitHub..." -ForegroundColor Yellow
if (Test-Path "$pluginDir\.git") {
    Set-Location $pluginDir
    git pull 2>&1 | Out-Null
    Write-Host "   Обновлено до последней версии" -ForegroundColor Green
} else {
    git clone $pluginUrl $pluginDir 2>&1 | Out-Null
    Write-Host "   Плагин скачан" -ForegroundColor Green
}

# 3. Клонируем или обновляем маркетплейс
if (Test-Path "$marketplaceDir\.git") {
    Set-Location $marketplaceDir
    git pull 2>&1 | Out-Null
} else {
    git clone $pluginUrl $marketplaceDir 2>&1 | Out-Null
}

# 4. Обновляем settings.json
Write-Host "3. Настраиваем Claude Code..." -ForegroundColor Yellow

$settings = @{}
if (Test-Path $settingsFile) {
    $settings = Get-Content $settingsFile -Raw | ConvertFrom-Json
}

# Добавляем маркетплейс
if (-not $settings.extraKnownMarketplaces) {
    $settings | Add-Member -NotePropertyName "extraKnownMarketplaces" -NotePropertyValue @{}
}
$marketplace = @{
    source = @{
        source = "github"
        repo = "sergejbatler-lgtm/technoguru-miniapp-plugin"
    }
}
$settings.extraKnownMarketplaces | Add-Member -NotePropertyName "technoguru-marketplace" -NotePropertyValue $marketplace -Force

# Добавляем плагин в enabledPlugins
if (-not $settings.enabledPlugins) {
    $settings | Add-Member -NotePropertyName "enabledPlugins" -NotePropertyValue @{}
}
$settings.enabledPlugins | Add-Member -NotePropertyName "technoguru-miniapp@technoguru-marketplace" -NotePropertyValue $true -Force

$settings | ConvertTo-Json -Depth 10 | Set-Content $settingsFile -Encoding UTF8
Write-Host "   settings.json обновлён" -ForegroundColor Green

# 5. Обновляем CLAUDE.md
Write-Host "4. Настраиваем триггеры..." -ForegroundColor Yellow

$triggerBlock = @"

# TechnoGuru — Telegram Mini App Plugin

Когда пользователь пишет что-то вроде «хочу мини-апп», «собрать мини-апп», «сделай мини-апп», «telegram mini app», «mini app» — немедленно читай и выполняй инструкции из файла:
`$pluginDir\skills\miniapp-welcome\SKILL.md`

Когда пользователь пишет «задеплой», «деплой», «залить на сервер» — читай:
`$pluginDir\skills\deploy-vps\SKILL.md`

Когда пользователь пишет «афиша», «добавь события», «афиша событий» — читай:
`$pluginDir\skills\miniapp-events\SKILL.md`

Технический фундамент:
`$pluginDir\core\telegram-miniapp-fundamentals.md`
"@

if (Test-Path $claudeMd) {
    $existing = Get-Content $claudeMd -Raw
    if ($existing -notlike "*TechnoGuru*") {
        Add-Content $claudeMd $triggerBlock -Encoding UTF8
    }
} else {
    Set-Content $claudeMd $triggerBlock -Encoding UTF8
}

Write-Host "   CLAUDE.md настроен" -ForegroundColor Green

# Готово
Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Готово! Перезапусти Claude Code." -ForegroundColor Green
Write-Host ""
Write-Host "Затем напиши в чате:" -ForegroundColor White
Write-Host "  хочу мини-апп" -ForegroundColor Cyan
Write-Host ""
