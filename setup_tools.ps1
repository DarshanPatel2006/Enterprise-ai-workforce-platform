# setup_tools.ps1
# Automates setting up portable Node.js and Python in c:\project\tools

$ErrorActionPreference = "Stop"

# Create directories
$toolsDir = "c:\project\tools"
if (-not (Test-Path $toolsDir)) {
    New-Item -ItemType Directory -Path $toolsDir | Out-Null
    Write-Host "Created tools directory at $toolsDir"
}

# 1. DOWNLOAD AND EXTRACT NODE.JS PORTABLE
$nodeDest = Join-Path $toolsDir "node"
$nodeZip = Join-Path $toolsDir "node.zip"

if (-not (Test-Path $nodeDest)) {
    Write-Host "Downloading Node.js..."
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri "https://nodejs.org/dist/v20.11.0/node-v20.11.0-win-x64.zip" -OutFile $nodeZip
    
    Write-Host "Extracting Node.js..."
    Expand-Archive -Path $nodeZip -DestinationPath $toolsDir
    
    # Rename extracted folder to 'node'
    $extractedNodeDir = Get-ChildItem -Path $toolsDir -Directory -Filter "node-v*" | Select-Object -First 1
    Rename-Item -Path $extractedNodeDir.FullName -NewName "node"
    
    Remove-Item $nodeZip
    Write-Host "Node.js set up successfully at $nodeDest"
} else {
    Write-Host "Node.js already exists at $nodeDest"
}

# 2. DOWNLOAD AND EXTRACT PYTHON EMBEDDABLE
$pythonDest = Join-Path $toolsDir "python"
$pythonZip = Join-Path $toolsDir "python.zip"

if (-not (Test-Path $pythonDest)) {
    Write-Host "Downloading Python..."
    Invoke-WebRequest -Uri "https://www.python.org/ftp/python/3.11.9/python-3.11.9-embed-amd64.zip" -OutFile $pythonZip
    
    Write-Host "Extracting Python..."
    New-Item -ItemType Directory -Path $pythonDest | Out-Null
    Expand-Archive -Path $pythonZip -DestinationPath $pythonDest
    
    Remove-Item $pythonZip
    Write-Host "Python extracted successfully at $pythonDest"
} else {
    Write-Host "Python already exists at $pythonDest"
}

# Configure Python path to enable site packages
$pthFile = Join-Path $pythonDest "python311._pth"
if (Test-Path $pthFile) {
    $content = Get-Content $pthFile
    if (-not ($content -contains "import site")) {
        Add-Content -Path $pthFile -Value "import site"
        Write-Host "Configured python311._pth to import site packages."
    }
}

# Install pip if not present
$pipFile = Join-Path $pythonDest "Scripts\pip.exe"
if (-not (Test-Path $pipFile)) {
    Write-Host "Downloading get-pip.py..."
    $getPipScript = Join-Path $pythonDest "get-pip.py"
    Invoke-WebRequest -Uri "https://bootstrap.pypa.io/get-pip.py" -OutFile $getPipScript
    
    Write-Host "Installing pip..."
    & (Join-Path $pythonDest "python.exe") $getPipScript
    Remove-Item $getPipScript
    Write-Host "pip installed successfully."
} else {
    Write-Host "pip is already installed."
}

# 3. INSTALL BACKEND DEPENDENCIES
Write-Host "Installing backend packages..."
& (Join-Path $pythonDest "python.exe") -m pip install fastapi uvicorn sqlalchemy pydantic python-jose[cryptography] passlib[bcrypt] chromadb google-generativeai groq requests python-multipart jinja2 fpdf2 pytest --quiet

Write-Host "Backend dependencies installed successfully."
Write-Host "Tools setup complete!"
