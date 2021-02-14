# Install

```
yarn
```




# Run
## Add twitter_ids in the twitter ids, each line new twitter id (integer)


```
1355651864096858114
1050535565383426051
1201876103964573700
3407586405
1347447910158499846
51362228
385045084
88412541
```


## from the server go to twitter ids save location and retrieve them:
```bash
cd /home/educoinme/educoinme/data
cat *.json | jq '.[].twitter_id' | xargs -I {} echo {}
```


## run node js and output will ge generated in tz2_addresses 
```
node compute_addresses.js
```

## output form: tz1_from_address,tz2_to_address,0,1 (atm sends 1 token)

```
tz1gHJt7J1aEtW2wpCR5RJd3CpnbVxUTaEXS,tz2FG3axiUsoXq962ZtHrSWoEf2RePAmGUeY,0,1
```

## run script to send tokens (atm on testnet)

```
node send_tokens.js
```
