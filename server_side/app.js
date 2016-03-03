'use strict';

const crypto = require('crypto');
const utils = require('./utils.js');
const $ = require('jquery');


exports.EncodeWallet = function(password)
{
    var jsonSavedKeyPairs = utils.getItem("KeyPairs").value || {};
    
    if (!Object.keys(jsonSavedKeyPairs).length || !password.length)
        return false;

    const hash1 = crypto.createHash("sha256")
                           .update(password)
                           .digest('base64');
    
    for (var key in jsonSavedKeyPairs)
    {
        const address = jsonSavedKeyPairs[key].address;
        const private_key = jsonSavedKeyPairs[key].private_key;
        
        const bip38 = utils.getBIP38(jsonSavedKeyPairs[key].network);
        
        jsonSavedKeyPairs[key].private_key = bip38.encrypt(private_key, hash1, address, function(status){console.log(status.percent)});
    }
    
    utils.setItem("KeyPairs", jsonSavedKeyPairs);
    return true;
};

exports.DecodeWallet = function(password)
{
    var jsonSavedKeyPairs = utils.getItem("KeyPairs").value || {};
    
    if (!Object.keys(jsonSavedKeyPairs).length)
        return true;
    
    if (!utils.isValidEncodePassword(password))
        return false;
        
    const hash1 = crypto.createHash("sha256")
                           .update(password)
                           .digest('base64');
    
    for (var key in jsonSavedKeyPairs)
    {
        const private_key = jsonSavedKeyPairs[key].private_key;
        
        const bip38 = utils.getBIP38(jsonSavedKeyPairs[key].network);
        
        jsonSavedKeyPairs[key].private_key = bip38.decrypt(private_key, hash1);
    }
    
    utils.setItem("KeyPairs", jsonSavedKeyPairs);
    return true;
    
};

exports.RefreshEncodeWalletTab = function()
{
    const savedPassword = utils.getSavedEncodePassword();

    $('#info_encrypt_status').removeClass('bg-danger');
    $('#info_encrypt_status').removeClass('info');
    if (savedPassword)
    {
        $('#info_encrypt_status').html('<h4>Your wallet is encoded!</h4>');
        $('#info_encrypt_note').html('Enter your password to decode wallet.');
        $('#submitEncryptWallet').html('Decode wallet');
        $('#divEncryptPassword2').hide();
        
        $('#divSignMessagePassword').show();
        $('#divNewKeyPairPassword').show();
        $('#divNewPivateKeyPassword').show();
        $('#divSendMoneyPassword').show();
        
        $('#info_encrypt_status').addClass('info');
    }
    else
    {
        $('#info_encrypt_status').html('<h4>Your wallet is decoded!</h4>');
        $('#info_encrypt_note').html('Enter your password to encode wallet.');
        $('#submitEncryptWallet').html('Encode wallet');
        $('#divEncryptPassword2').show();
        
        $('#divSignMessagePassword').hide();
        $('#divNewKeyPairPassword').hide();
        $('#divNewPivateKeyPassword').hide();
        $('#divSendMoneyPassword').hide();
        
        $('#info_encrypt_status').addClass('bg-danger');
    }
};

exports.UpdateKeyPairsTableHTML = function()
{
    var jsonSavedKeyPairs = utils.getItem("KeyPairs").value || {}; 
    
    $( "#keypairs" ).html('');
    for (var key in jsonSavedKeyPairs)
    {
        console.log('jsonSavedKeyPairs[key].network]='+jsonSavedKeyPairs[key].network);
        if (utils.coinsInfo[jsonSavedKeyPairs[key].network] == undefined)
            continue;
            
        const address = jsonSavedKeyPairs[key].address;
        
        //console.log('key='+key+'; address='+address);
        //console.log('jsonSavedKeyPairs[key].network='+jsonSavedKeyPairs[key].network);
        
        const tdCoin = $('<td class="col-md-1">' + utils.coinsInfo[jsonSavedKeyPairs[key].network][0]+"</td>");
        const tdPublic = $('<td class="col-md-4">'+address+"</td>");
        const tdBalance = $('<td class="col-md-1">'+jsonSavedKeyPairs[key].balance +"</td>");
        const tdPrivate = $('<td class="col-md-6">'+jsonSavedKeyPairs[key].private_key+"</td>");
 
        var btnClose = $('<button type="button" class="btn btn-default" aria-label="Left Align"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></button>');
        btnClose[0].onclick = function(){
            utils.deleteKey("KeyPairs", address);
            exports.UpdateKeyPairsTableHTML();
        };
        const tdDelete = $("<td class='col-md-1'></td>").append(btnClose);
        
        $( "#keypairs" ).append($("<tr></tr>").append(
            tdCoin, tdPublic, tdBalance, tdPrivate, tdDelete ));
    }
};

exports.UpdatePublicKeysTableHTML = function()
{
    var jsonSavedPublicKeys = utils.getItem("PublicKeys").value || {}; 
    
    $( "#addresses_to_send" ).html('');
    for (var key in jsonSavedPublicKeys)
    {
        //console.log('key='+key);
        const address = jsonSavedPublicKeys[key].address;
        const network = jsonSavedPublicKeys[key].network;
        
        const strCoinShortName = utils.coinsInfo[network][3];
        const strLabel = jsonSavedPublicKeys[key].label;
        
        //console.log('jsonSavedPublicKeys[key]='+JSON.stringify(jsonSavedPublicKeys[key]));
        //console.log('jsonSavedPublicKeys[key].network='+JSON.stringify(network));
        
        const tdCoin = $('<td class="col-md-1">' + utils.coinsInfo[network][0]+"</td>");
        const tdPublic = $("<td class='col-md-5'>"+address+"</td>");
        const tdLabel = $("<td class='col-md-6'>"+strLabel +"</td>");
        
        var btnSend = $('<button type="button" class="btn btn-default" aria-label="Left Align"><span class="glyphicon glyphicon-send" aria-hidden="true"></span></button>');
         btnSend[0].onclick = function(){
             require('./sendTransaction').onOpenDialog(network, address, strLabel, strCoinShortName);
        };
        
        const tdSend= $("<td class='col-md-1'></td>").append(btnSend);

        var btnClose = $('<button type="button" class="btn btn-default" aria-label="Left Align"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></button>');
        btnClose[0].onclick = function(){
            utils.deleteKey("PublicKeys", address);
            exports.UpdatePublicKeysTableHTML();
        };
        const tdDelete = $("<td class='col-md-1'></td>").append(btnClose);
        
        $( "#addresses_to_send" ).append($("<tr></tr>").append(
            tdCoin, tdPublic, tdLabel, tdSend, tdDelete ));
    }
};

exports.UpdateTransactionsTableHTML = function()
{
    $( "#transactions" ).html('');

    var jsonSavedKeyPairs = utils.getItem("KeyPairs").value || {}; 
    
    var arrayTXs = [];
    
    for (var key in jsonSavedKeyPairs)
    {
        const txs = jsonSavedKeyPairs[key].txs || 0;
        if (!txs) continue;
            
        jsonSavedKeyPairs[key].txs.forEach(function(transaction) {
            const tx = {
                "network" : utils.coinsInfo[jsonSavedKeyPairs[key].network][0],
                "address" : key,
                "transaction" : transaction
                };
            arrayTXs.push(tx);
        });
    }
    
    arrayTXs.sort(function(tx1, tx2) {
        return new Date(tx2.transaction.time_utc).getTime() - new Date(tx1.transaction.time_utc).getTime();
    });
    
   /*arrayTXs.forEach(function(tx) {
        const tdCoin = $("<td>"+ tx.network+"</td>");
        const tdStatus = $("<td>" + tx.transaction.confirmations + "</td>");
        const tdDate = $("<td>" + tx.transaction.time_utc + "</td>");
        const tdDescription = $("<td>" + tx.transaction.tx + "</td>");

        var tdAmountClass = 'success';
        if (parseFloat(tx.transaction.amount) < 0)
            tdAmountClass = 'danger';
            
        const tdAmount = $("<td class='"+tdAmountClass+"'>"+ tx.transaction.amount + "</td>");
                

        $( "#transactions" ).append($("<tr></tr>").append(
            tdCoin, tdStatus, tdDate, tdDescription, tdAmount ));
        
    });*/
    
    var groupTXs = {};
    arrayTXs.forEach(function(tx) {
        if (groupTXs[tx.transaction.tx])
        {
            groupTXs[tx.transaction.tx].transaction.amount = 
                (parseFloat(groupTXs[tx.transaction.tx].transaction.amount) + parseFloat(tx.transaction.amount)).toFixed(8);
        }
        else
        {
            groupTXs[tx.transaction.tx] = tx;
        }
            
    });
    for (var key in groupTXs)
    {
        const tx = groupTXs[key];
        
        const tdCoin = $("<td>"+ tx.network+"</td>");
        const tdStatus = $("<td>" + tx.transaction.confirmations + "</td>");
        const tdDate = $("<td>" + tx.transaction.time_utc + "</td>");
        const tdDescription = $("<td>" + tx.transaction.tx + "</td>");

        var tdAmountClass = 'success';
        if (parseFloat(tx.transaction.amount) < 0)
            tdAmountClass = 'danger';
            
        const tdAmount = $("<td class='"+tdAmountClass+"'>"+ parseFloat(tx.transaction.amount).toFixed(8) + "</td>");
                

        $( "#transactions" ).append($("<tr></tr>").append(
            tdCoin, tdStatus, tdDate, tdDescription, tdAmount ));
    }
};

exports.AddKeyPair = function(keyPair, password)
{
    var jsonSavedKeyPairs = utils.getItem("KeyPairs").value || {}; 
    
    if (password.length && !utils.isValidEncodePassword(password))
        return;
    
    const hash1 = password.length ? crypto.createHash("sha256")
                           .update(password)
                           .digest('base64') : "";

    const bip38 = utils.getBIP38(keyPair.network.pubKeyHash);
        
    utils.getBalance(keyPair.network.pubKeyHash, [keyPair.getAddress()], function(data) {
        if (data.status.localeCompare('success') != 0)
            return;
            
        [].concat(data.data).forEach(function(element) {
            
            if (element.address.localeCompare(keyPair.getAddress()) == 0)
            {
               // element.private_key = keyPair.toWIF();
                
                element.private_key = hash1.length ? 
                    bip38.encrypt(keyPair.toWIF(), hash1, keyPair.getAddress(), function(status){console.log(status.percent)}) :
                    keyPair.toWIF();
            }
                
            element.network = keyPair.network.pubKeyHash;
                
            jsonSavedKeyPairs[element.address] = element;

        });
        
        utils.setItem("KeyPairs", jsonSavedKeyPairs);
        exports.UpdateKeyPairsTableHTML();
    });
};

exports.AddPublicKey = function(key, label)
{
    var network = utils.get_address_type(key);

    if (!network || (!network.length))
        return;
    
    var jsonSavedPublicKeys = utils.getItem("PublicKeys").value || {}; 
    
    jsonSavedPublicKeys[key] = {'address' : key, 'label' : label, 'network' : parseInt(network, 16)};

    utils.setItem("PublicKeys", jsonSavedPublicKeys);
    
    exports.UpdatePublicKeysTableHTML();
};

exports.RefreshKeyPairsBalance = function()
{
    var jsonSavedKeyPairs = utils.getItem("KeyPairs").value || {}; 
    
    var pairs = {};
    for (var key in jsonSavedKeyPairs)
    {
        if (utils.coinsInfo[jsonSavedKeyPairs[key].network] == undefined)
            continue;
            
        if (pairs[jsonSavedKeyPairs[key].network] == undefined)
            pairs[jsonSavedKeyPairs[key].network] = [];
            
        pairs[jsonSavedKeyPairs[key].network].push( jsonSavedKeyPairs[key].address );
    }
    
    for (var keyHash in pairs)
    {
        utils.getBalance(keyHash, pairs[keyHash], function(data) {
            if (data.status.localeCompare('success') != 0)
                return;
                
            [].concat(data.data).forEach(function(element) {
                if (jsonSavedKeyPairs[element.address] == undefined)
                    return;
                
                console.log('set balance for '+ element.address + ": " + element.balance);    
                jsonSavedKeyPairs[element.address].balance = element.balance;
            });
            utils.setItem("KeyPairs", jsonSavedKeyPairs);
            exports.UpdateKeyPairsTableHTML();
        });
    }
};