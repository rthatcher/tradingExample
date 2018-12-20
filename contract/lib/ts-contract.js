/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


/* 
* This sample uses a "model" with 2 types - Commodity and Trader
* The functions expect be to passed a Key and a JS Object where required
* e.g.  Commodity Key 'GOLD'
*                 Object {docType: 'commodity', description: 'Yellow Bars', mainExchange: 'London', quantity: 100, owner: 'Trader1'}
*       Trader Key 'Trader1'
*                 Object {docType: 'trader', firstName: 'Jenny', lastName: 'Jones'}
*/

'use strict';

const { Contract } = require('fabric-contract-api');

class TsContract extends Contract {

    async init(ctx) {
        console.info('init');
    }

    async createCommodity(ctx, comKey, commodity) {
        console.info('createCommodity', comKey);
        await ctx.stub.putState(comKey, commodity);
        return 'Commodity Created: ' + comKey;
    }

    async createTrader(ctx, traderKey, trader) {
        console.info('createTrader', traderKey);
        await ctx.stub.putState(traderKey, trader);
        return `Trader Created: ${traderKey}`;
    }

    async checkQuantity(ctx, comKey) {
        console.info('Check Quantity', comKey);

        let commodityBytes = await ctx.stub.getState(comKey);

        if (commodityBytes.length > 0) {
            var commodity = JSON.parse(commodityBytes);
            console.info('Commodity Checked Quantity: ', commodity.quantity);

            return 'Checked Quantity: ' + commodity.quantity;
        }
        else {
            console.info('No Commodity with that Key: ', comKey);
            return 'No Commodity with that Key: ' + comKey;
        }
    }

    async plusTen(ctx, comKey) {
        console.info('Add Ten to Quantity !!', comKey);

        let commodityBytes = await ctx.stub.getState(comKey);

        if (commodityBytes.length > 0) {
            var commodity = JSON.parse(commodityBytes);
            console.info('Commodity Old Quantity: ', commodity.quantity);
            commodity.quantity = commodity.quantity + 10;
            console.info('New Quantity: ', commodity.quantity);
            await ctx.stub.putState(comKey, JSON.stringify(commodity));

            return `New Quantity:  ${commodity.quantity}`;
        }
        else {
            console.info('No Commodity with that Key: ', comKey);
            return 'No Commodity with that Key: ' + comKey;
        }
    }

    async trade(ctx, comKey, newOwner) {
        console.info('Trade to new owner', comKey, '  ', newOwner);

        let commodityBytes = await ctx.stub.getState(comKey);
        if (commodityBytes.length > 0) {
            var commodity = JSON.parse(commodityBytes);
            console.info('Commodity Existing Owner: ', commodity.owner);
            commodity.owner = newOwner;
            console.info('New Owner: ', commodity.owner);
            await ctx.stub.putState(comKey, JSON.stringify(commodity));

            return 'New Owner: ' + commodity.owner;
        }
        else {
            console.info('No Commodity with that Key: ', comKey);
            return 'No Commodity with that Key: ' + comKey;
        }
    }

    async deleteCommodity(ctx, comKey) {
        console.info('Remove the Commodity', comKey);
        let commodityBytes = await ctx.stub.getState(comKey);
        if (commodityBytes.length > 0) {
            var commodity = JSON.parse(commodityBytes);
            if (commodity.docType == 'commodity') {
                await ctx.stub.deleteState(comKey);
                console.info('Commodity deleted: ', comKey);
                return 'Commodity deleted: ' + comKey;
            }
            else {
                console.info('Key exists, but Not a Commodity - NOT deleted: ', comKey);
                return 'Key exists, but Not a Commodity - NOT deleted: ' + comKey;
            }
        }
        else {
            console.info('No Commodity with that Key: ', comKey);
            return 'No Commodity with that Key: ' + comKey;
        }
    }

    async setupDemo(ctx) {
        console.info('setupDemo - 2 Commodities, 2 Traders');

        var comKey = 'GOLD';
        var commodity = { docType: 'commodity', description: 'Yellow Bars', mainExchange: 'London', quantity: 100, owner: 'Trader1' };
        await ctx.stub.putState(comKey, JSON.stringify(commodity));

        comKey = 'COAL';
        commodity = { docType: 'commodity', description: 'Black Gold', mainExchange: 'Cardiff', quantity: 300, owner: 'Trader2' };
        await ctx.stub.putState(comKey, JSON.stringify(commodity));

        var traderKey = 'Trader1';
        var trader = { docType: 'trader', firstName: 'Jenny', lastName: 'Jones' };
        await ctx.stub.putState(traderKey, JSON.stringify(trader));

        traderKey = 'Trader2';
        trader = { docType: 'trader', firstName: 'Jack', lastName: 'Sock' };
        await ctx.stub.putState(traderKey, JSON.stringify(trader));

        return;
    }

    async historyForCommodity(ctx, comKey) {
        console.info('Commodity History: ', comKey);

        let commodityQI = await ctx.stub.getHistoryForKey(comKey);

        let results = [];
        let res = { done: false };
        while (!res.done) {
            res = await commodityQI.next();
            if (res && res.value && res.value.value) {
                let val = res.value.value.toString('utf8');
                if (val.length > 0) {
                    results.push(JSON.parse(val));
                }
            }
            if (res && res.done) {
                try {
                    commodityQI.close();
                }
                catch (err) {
                }
            }
        }
        console.info(' Results from query');
        results.forEach(comHist => {
            console.info(comHist);
        });
        return results;
    }

    async qCommodityByOwner(ctx, comOwner) {
        console.info('Query Commodity by Owner: ', comOwner);

        let qString = '{"selector":{"docType":"commodity","owner":"' + comOwner + '"}}';
        let commodityQI = await ctx.stub.getQueryResult(qString);

        let results = [];
        let res = { done: false };
        while (!res.done) {
            res = await commodityQI.next();
            if (res && res.value && res.value.value) {
                let val = res.value.value.toString('utf8');
                if (val.length > 0) {
                    results.push(JSON.parse(val));
                }
            }
            if (res && res.done) {
                try {
                    commodityQI.close();
                }
                catch (err) {
                }
            }
        }
        console.info(' Results from query');
        results.forEach(comHist => {
            console.info(comHist);
        });
        return results;
    }

    async qCommodityByExchange(ctx, comEx) {
        console.info('Query Commodity by Exchange: ', comEx);

        let qString = '{"selector":{"docType":"commodity","mainExchange":"' + comEx + '"}}';
        let commodityQI = await ctx.stub.getQueryResult(qString);

        let results = [];
        let res = { done: false };
        while (!res.done) {
            res = await commodityQI.next();
            if (res && res.value && res.value.value) {
                let val = res.value.value.toString('utf8');
                if (val.length > 0) {
                    results.push(JSON.parse(val));
                }
            }
            if (res && res.done) {
                try {
                    commodityQI.close();
                }
                catch (err) {
                }
            }
        }
        console.info('~~~~~~Results~~~~~~');
        console.info(results);
        console.info('~~~~~~End Results~~~~~~');
        return results;
    }

}

module.exports = TsContract;
