/*
SPDX-License-Identifier: Apache-2.0
*/

'use strict';

// Bring key classes into scope, most importantly Fabric SDK network class
const fs = require('fs');
const { FileSystemWallet, Gateway } = require('fabric-network');

// A wallet stores a collection of identities for use
const wallet = new FileSystemWallet('./wallet');

async function main() {

    // A gateway defines the peers used to access Fabric networks
    const gateway = new Gateway();

    // Main try/catch block
    try {

        // define the identity to use
        const identityLabel = 'User1@org1.example.com';

        // Load connection profile; will be used to locate a gateway
        //        let connectionProfile = yaml.safeLoad(fs.readFileSync('network.yaml', 'utf8'));
        let ccpFile = fs.readFileSync('connection.json');
        const ccp = JSON.parse(ccpFile.toString());
        console.log('~~~~~~~~~~~~connectionProfile~~~~~~~~~~~~~~~~');
        //console.log(ccp);


        // Set connection options; use 'admin' identity from application wallet
        let connectionOptions = {
            identity: identityLabel,
            wallet: wallet,
            discovery: {
                asLocalHost: true
            }
        };

        // Connect to gateway using application specified parameters
        await gateway.connect(ccp, connectionOptions);

        console.log('Connected to Fabric gateway.');
        console.log('~~~~~~~~~~~~gateway~~~~~~~~~~~~~~~~');
        //console.log(gateway);

        // Get addressability network (channel)
        const network = await gateway.getNetwork('mychannel');
        console.log('~~~~~~~~~~~~network~~~~~~~~~~~~~~~~');
        //console.log(network);


        // Get addressability to trade contract
        const contract = await network.getContract('tradesample');
        console.log('~~~~~~~~~~~~contract~~~~~~~~~~~~~~~~');
        //console.log(contract);
        console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~');

        console.log('Submit transactions.');

        // Create Commodity
        var testCommodityKey = 'CORN';
        var testCommodityJS = { docType: 'commodity', description: 'Organic Early Harvest Corn', mainExchange: 'London', quantity: 200, owner: 'Trader3' };
        var testCommodity = JSON.stringify(testCommodityJS);
        var response = await contract.submitTransaction('createCommodity', testCommodityKey, testCommodity);
        console.log('Transaction Response:', response.toString());

        // Create Trader
        var testTraderKey = 'TRADER3';
        var testTraderJS = { docType: 'trader', firstName: 'Rainer', lastName: 'Valens' };
        var testTrader = JSON.stringify(testTraderJS);
        response = await contract.submitTransaction('createTrader', testTraderKey, testTrader);
        console.log('Transaction Response:', response.toString());

        // Add Ten Quantity - checking quantity before and afterwards!
        response = await contract.submitTransaction('checkQuantity', 'CORN');
        console.log('Transaction Response:', response.toString());

        response = await contract.submitTransaction('plusTen', 'CORN');
        console.log('Transaction Response:', response.toString());

        response = await contract.submitTransaction('checkQuantity', 'CORN');
        console.log('Transaction Response:', response.toString());

        // Trade commodity to a new owner
        response = await contract.submitTransaction('trade', 'CORN', 'Trader1');
        console.log('Transaction Response:', response.toString());

        // Check Quantity of non-existent Commodity !
        console.log('check Quantity KORNE - expected failure');
        response = await contract.submitTransaction('checkQuantity', 'KORNE');
        console.log('Transaction Response:', response.toString());

        // Trying execute instead of submit!
        console.log('trying execute');
        response = await contract.evaluateTransaction('checkQuantity', 'CORN');
        console.log('Transaction Response:', response.toString());

        // History Query
        console.log('trying History Query');
        var response = await contract.evaluateTransaction('historyForCommodity', 'CORN');
        console.log('Transaction Response:', response.toString());

        // Add More data before Queries !
        console.log('Add more data before Queries');
        response = await contract.submitTransaction('setupDemo');
        console.log('Transaction Response:', response.toString());

        // Trying Commodity by Owner Query !
        console.log('trying Commodity by Owner Query');
        response = await contract.evaluateTransaction('qCommodityByOwner', 'Trader1');
        console.log('Transaction Response:');
        console.log(response.toString());

        // Trying Commodity by Exchange Query !
        console.log('trying Commodity by Exchange Query - London');
        response = await contract.evaluateTransaction('qCommodityByExchange', 'London');
        console.log('Transaction Response:');
        console.log(response.toString());

        // Trying Commodity by Exchange Query !
        console.log('trying Commodity by Exchange Query - Cardiff');
        response = await contract.evaluateTransaction('qCommodityByExchange', 'Cardiff');
        console.log('Transaction Response:');
        console.log(response.toString());

        // Trying Commodity by Exchange Query !
        console.log('trying Commodity by Exchange Query - Newport');
        response = await contract.evaluateTransaction('qCommodityByExchange', 'Newport');
        console.log('Transaction Response:');
        console.log(response.toString());

        // Delete commodity 
        response = await contract.submitTransaction('deleteCommodity', 'CORN');
        console.log('Transaction Response:', response.toString());

        // Delete commodity with Wrong Doc type to test error message!
        response = await contract.submitTransaction('deleteCommodity', 'TRADER3');
        console.log('Transaction Response:', response.toString());

        // Delete GOLD Commodity
        console.log('Delete Gold');
        response = await contract.submitTransaction('deleteCommodity', 'GOLD');
        console.log('Transaction Response:', response.toString());

        // Delete non-existent Commodity
        console.log('Delete Gold - expected failure!');
        response = await contract.submitTransaction('deleteCommodity', 'GOLD');
        console.log('Transaction Response:', response.toString());

    } catch (error) {
        console.log(`Error processing transaction. ${error}`);
        console.log(error.stack);
    } finally {
        // Disconnect from the gateway
        console.log('Disconnect from Fabric gateway.');
        gateway.disconnect();
    }
}

main().then(() => {
    console.log('done');
}).catch((e) => {
    console.log(e);
    console.log(e.stack);
    process.exit(-1);
});
