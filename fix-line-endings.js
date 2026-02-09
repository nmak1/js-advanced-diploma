const fs = require('fs');
const path = require('path');

function convertFiles(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Пропускаем node_modules и другие служебные папки
      if (!['node_modules', '.git', 'dist', 'coverage'].includes(file)) {
        convertFiles(filePath);
      }
    } else if (file.endsWith('.js') || file.endsWith('.css') || file.endsWith('.html')) {
      // Читаем файл
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Заменяем все CRLF на LF
      content = content.replace(/\r\n/g, '\n');
      
      // Записываем обратно
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed: ${filePath}`);
    }
  });
}

// Конвертируем файлы в src
convertFiles(path.join(__dirname, 'src'));

// Конвертируем конфигурационные файлы
['.eslintrc.js', 'jest.config.js', 'webpack.config.js'].forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/\r\n/g, '\n');
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Fixed: ${file}`);
  }
});
