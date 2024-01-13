import { program } from 'commander';
import pkg from '../package.json';
import { WcfWSServer } from './lib/ws';

function main() {
    program
        .name('wcfwebsocket')
        .version(pkg.version)
        .description('start a wcferry websocket server')
        .option('-p,--port <number>', 'websocket port', '8000')
        .option('-h,--host <string>', 'websocket host', '127.0.0.1')
        .option('-P,--rpc-port <number>', 'wcferry rpc endpoint', '10086')
        .option(
            '-H, --rpc-host <string>',
            'wcferry rpc host. if empty, program will try to execute wcferry.exe',
            ''
        )
        .action((options) => {
            WcfWSServer.start({
                wcferry: {
                    port: Number.parseInt(options.rpcPort, 10) || 10086,
                    host: options.rpcHost,
                },
                ws: {
                    port: Number.parseInt(options.port, 10) || 8000,
                    host: options.host,
                },
            });
        });
    program.parse();
}

void main();
