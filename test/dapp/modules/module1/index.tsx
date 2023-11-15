import { Module, Styles, Container, customModule, application, Label, Input } from '@ijstech/components';
import { Wallet, MetaMaskProvider } from "@ijstech/eth-wallet";
import Assets from '@modules/assets';
@customModule
export default class Module1 extends Module {
    
    private key1: Input;
    private key2: Input;
    private key3: Input;
    private isWalletConnected() {
        const wallet = Wallet.getClientInstance();
        return wallet.isConnected;
    }
    private toHexString(a: Uint8Array): string {
        let ret = '';
        a.forEach(e => {ret += e.toString(16).padStart(2, "0");});
        return ret;
    }
    private genKey() {
        this.key1.value = this.toHexString(crypto.getRandomValues(new Uint8Array(32)));
    }
    private async encrypt() {
        console.log('encrypt')
        const wallet = Wallet.getClientInstance();
        if (!wallet.isConnected) {
            let provider = new MetaMaskProvider(wallet as Wallet/*, events, options*/);
            wallet.connect(provider);
        }
        let ret = await wallet.encrypt(this.key1.value)
        console.log(ret);
        this.key2.value = ret;
    }
    private async decrypt() {
        console.log('decrypt')
        const wallet = Wallet.getClientInstance();
        if (!wallet.isConnected) {
            let provider = new MetaMaskProvider(wallet as Wallet/*, events, options*/);
            wallet.connect(provider);
            console.log('connect')
        }
        let ret = await wallet.decrypt(this.key2.value)
        console.log(ret);
        this.key3.value = ret;
    }
    render(){
        return <i-panel><i-vstack>
                 <i-button  width={150} caption='genKey' onClick={this.genKey.bind(this)}></i-button>
                 <i-input  inputType="text" id='key1' caption='original' width={600}></i-input>
                 <i-button  width={150} caption='encrypt' onClick={this.encrypt.bind(this)}></i-button>
                 <i-input  inputType="text" id='key2' caption='encrypted' width={600}></i-input>
                 <i-button  width={150} caption='decrypt' onClick={this.decrypt.bind(this)}></i-button>
                 <i-input  inputType="text" id='key3' caption='decrypted' width={600}></i-input>
               </i-vstack></i-panel>
    }
}