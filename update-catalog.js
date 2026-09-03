const fs = require('fs');
let code = fs.readFileSync('src/pages/Catalog.tsx', 'utf8');

code = code.replace(
  "const message = `Новый заказ!%0A%0A${text}${totalText}`;",
  "const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;\n    const usernameText = tgUser?.username ? `%0AОт: @${tgUser.username}` : '';\n    const message = `Новый заказ!%0A%0A${text}${totalText}${usernameText}`;"
);

fs.writeFileSync('src/pages/Catalog.tsx', code);
