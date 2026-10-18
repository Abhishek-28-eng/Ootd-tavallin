const os = require('os');
const { spawn } = require('child_process');

// Find the Wi-Fi or active LAN IP address that is not VirtualBox (192.168.56.x)
const nets = os.networkInterfaces();
let ip = '192.168.1.25';

for (const [name, netList] of Object.entries(nets)) {
  if (name.toLowerCase().includes('virtualbox') || name.includes('Ethernet 4')) continue;
  for (const net of netList || []) {
    if (net.family === 'IPv4' && !net.internal && !net.address.startsWith('192.168.56.')) {
      ip = net.address;
      break;
    }
  }
}

console.log(`\n======================================================`);
console.log(`📱 Tavallin Mobile — Starting on Wi-Fi IP: ${ip}`);
console.log(`======================================================\n`);

process.env.REACT_NATIVE_PACKAGER_HOSTNAME = ip;
process.env.NODE_OPTIONS = `${process.env.NODE_OPTIONS || ''} --max-old-space-size=4096`.trim();

const expoCliPath = require.resolve('expo/bin/cli');
const args = [expoCliPath, 'start', '--lan', '-c', ...process.argv.slice(2)];

const child = spawn(process.execPath, args, {
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code) => process.exit(code ?? 0));
