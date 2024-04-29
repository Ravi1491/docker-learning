const express = require("express");
const crypto = require("crypto");
const axios = require("axios");
const querystring = require("querystring");

const app = express();
const port = 3000;

const apiKey = "8f78e5908e18b115fe365022cd9c3c4b";
const apiSecret = "e740d0739b38b7d56abaea854f158263";
const scopes = "read_products,read_orders";

app.get("/", (req, res) => {
  res.send("SHOPIFY OAUTH");
});

app.get("/install", (req, res) => {
  console.log("first");
  const shop = req.query.shop || "xg-dev";

  if (!shop) {
    res.send("Shop parameter is missing");
    return;
  }
  // https://07a4-2409-40d1-1022-598f-135-cf79-3dc8-4037.ngrok-free.app/install?shop=xg-dev
  // https://07a4-2409-40d1-1022-598f-135-cf79-3dc8-4037.ngrok-free.app/install?shop=f0d467
  const nonce = crypto.randomBytes(8).toString("hex");
  const redirectUri = `https://07a4-2409-40d1-1022-598f-135-cf79-3dc8-4037.ngrok-free.app/oauth/callback`;

  const authUrl = `https://${shop}.myshopify.com/admin/oauth/authorize?client_id=${apiKey}&scope=${scopes}&redirect_uri=${redirectUri}&state=${nonce}`;

  res.redirect(authUrl);
});

app.get("/oauth/callback", async (req, res) => {
  const { code, shop, state } = req.query;
  console.log("second", code, shop, state);

  if (!code || !shop) {
    res.send("Missing code or shop parameter");
    return;
  }

  // if (state !== req.session.nonce) {
  //   res.send("Nonce mismatch. Possible CSRF attack.");
  //   return;
  // }

  const accessTokenUrl = `https://${shop}/admin/oauth/access_token`;
  const accessParams = {
    client_id: apiKey,
    client_secret: apiSecret,
    code,
  };

  try {
    const response = await axios.post(
      accessTokenUrl,
      querystring.stringify(accessParams),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const { access_token } = response.data;
    console.log("ACCESS ", access_token);

    const shopInfoUrl = `https://${shop}/admin/shop.json`;
    const shopInfoResponse = await axios.get(shopInfoUrl, {
      headers: {
        "X-Shopify-Access-Token": access_token,
      },
    });
    console.log("shopInfoResponse ");
    // https://07a4-2409-40d1-1022-598f-135-cf79-3dc8-4037.ngrok-free.app/install?shop=xg-dev

    const orders = await axios.get(
      `https://${shop}/admin/api/2023-10/orders.json?status=any`,
      {
        headers: {
          "X-Shopify-Access-Token": access_token,
        },
      }
    );
    console.log("orders ", Object.keys(orders.data.orders[0]));
    console.log("orders ", orders.data.orders[0].line_items);

    const storeDetails = shopInfoResponse.data.shop;
    // console.log("storeDetails ", storeDetails);
    res.json(storeDetails);
  } catch (error) {
    console.error("Error during OAuth callback:", error);
    res.send("Error during OAuth callback");
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
