//подключаем веб-сервер
const express = require('express');
const port = 8888;
const app = express();

//запуск веб-сервера
app.listen(port, () => {
    console.log('We are live on ' + port);
});
app.use(express.static('public'));