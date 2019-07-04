'use strict';

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').load();
}

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripePublicKey = process.env.STRIPE_PUBLIC_KEY;
const port = process.env.PORT;

const express = require('express');
const app = express();
const fs = require('fs');
const stripe = require('stripe')(stripeSecretKey);

app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.static('public'));

app.get('/store', function(req, res) {
  fs.readFile('items.json', function(error, data) {
    if (error) {
      res.status(500).end();
    }
    else {
      res.render('store.ejs', {
        stripePublicKey: stripePublicKey,
        items: JSON.parse(data)
      });
    }
  });
});

app.post('/purchase', function(req, res) {
  fs.readFile('items.json', function(error, data) {
    if (error) {
      res.status(500).end();
    }
    else {
      const itemsJson = JSON.parse(data);
      const itemsArray = itemsJson.music.concat(itemsJson.merch);
      let total = 0;
      req.body.items.forEach(function(item) {
        const itemJson = itemsArray.find(function(i) {
          const itemId = +item.id;
          return i.id === itemId;
        });
        total += itemJson.price * item.quantity;
      });

      stripe.charges.create({
        amount: total,
        source: req.body.stripeTokenId,
        currency: 'usd'
      }).then(function() {
        console.log('Charge Successful'); // eslint-disable-line no-console
        res.json({ message: 'Successfully purchased items' });
      }).catch(function() {
        console.error('Charge Fail');
        res.status(500).end();
      });
    }
  });
});

app.listen(port);
console.log('Server is listening at: ', port); // eslint-disable-line no-console
