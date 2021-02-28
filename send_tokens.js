const { TezosToolkit } = require("@taquito/taquito");
const { InMemorySigner } = require("@taquito/signer");
const fs = require("fs");
const csv = require("csv-parser");

const { Sequelize, Model, DataTypes } = require('sequelize');


// Settings to be modified by the user
const privateKey = "edskRvVe2sg2wy8GSW78NNvg9ByGXaY6GbtbNnAzDkB2W9APMUB18p4hfTs5xmZ62LPqpkmJ5m1v6mgCizTLVCPm8nJ4GU439C";
const network = "https://testnet-tezos.giganode.io";
const contractAddress = "KT1BiBXfJkKZXHKZjRNktAbrPLERE1YDu27f";

// sets up the Tezos Toolkit
const Tezos = new TezosToolkit(network);
// sets up the signer with the provided private key
const signer = new InMemorySigner(privateKey);
Tezos.setSignerProvider(signer);
// loads the data
const data = [];
const STATUS_PENDING = 1;
const STATUS_SENT = 2;
class Main extends Model {}

(async() => {
    try {
        const sequelize = new Sequelize({
            dialect: 'sqlite',
            storage: 'db/database.sqlite'
        });
        await sequelize.sync({force: true});

        Main.init({
            twitterId: {
                type: DataTypes.INTEGER,
                uniqueKey: true
            },
            sender: DataTypes.STRING,
            receiver: DataTypes.STRING,
            tokenId: DataTypes.INTEGER,
            amount: DataTypes.BIGINT,
            status: DataTypes.TINYINT
        }, {sequelize, modelName: 'main'});
        await Main.sync();

        let jobs = await Main.findAll({
            where: {status: STATUS_PENDING}
        });
        if (jobs.length > 0) {
            const transfers = [];
            for(let i=0; i<jobs.length; i++) {
                let job = jobs[i];
                transfers.push({
                    from_: job.sender,
                    txs: [{
                        to_: job.receiver,
                        token_id: job.tokenId,
                        amount: job.amount,
                    }]
                });
                job.status = STATUS_SENT;
                await job.save();

            }
            console.log(transfers);
            let contract = await Tezos.contract.at(contractAddress);
            const op = await contract.methods
                .transfer(transfers)
                .send();
            console.log(op.hash);
            await op.confirmation();
        }

    } catch (e) {
        console.log(e);
    }
})();
//
//
// const parser = fs.createReadStream('./data.csv')
//     .pipe(csv(["sender", "recipient", "tokenID", "amount"]))
//     .on("data", line => data.push(line))
//     .on("end", () => {
//         // loops through the data to format them before sending the transaction
//         const transfers = data.map(transfer => {
//             return {
//                 from_: transfer.sender,
//                 txs: [
//                     {
//                         to_: transfer.recipient,
//                         token_id: transfer.tokenID,
//                         amount: transfer.amount
//                     }
//                 ]
//             }
//         })
//         // sets up the contract abstraction
//         Tezos.contract.at(contractAddress).then(async contract => {
//             try {
//                 const op = await contract.methods
//                     .transfer(transfers)
//                     .send();
//                 console.log(op.hash);
//                 await op.confirmation();
//             } catch (err) {
//                 console.log(err)
//             }
//         });
//     });
