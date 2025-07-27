# ⚙️ CONFIGURA AQUÍ TU REPO
$githubRepoUrl = "https://github.com/yoshimitzucalderon/CloudERPSuitelocal"  # cambia por tu URL

# 🧱 1. Inicializa Git
git init

# 📤 2. Prepara y realiza primer commit
git add .
git commit -m "Primer commit desde script"

# 🔁 3. Renombra master a main
git branch -m master main

# 🔗 4. Conecta con el repositorio remoto
git remote remove origin -ErrorAction SilentlyContinue
git remote add origin $githubRepoUrl

# ☁️ 5. Sube a GitHub
git push -u origin main

# 🛠️ 6. Configura saltos de línea (CRLF para Windows)
git config --global core.autocrlf true

Write-Host "`n🚀 Proyecto subido exitosamente a $githubRepoUrl con rama 'main'"
