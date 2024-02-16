import { Client } from "pg";
import dotenv from "dotenv";
import { hashPassword } from "../hash";

dotenv.config();
const client = new Client({
  database: process.env.DB_NAME,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
});

type UserType = {
  username: string;
  password: string;
};

type ProductType = {
  name: string;
  price: number;
  image: string;
};

async function main() {
  await client.connect();

  const userData: UserType[] = [
    { username: "test1", password: await hashPassword("1234") },
  ];

  for (let entry of userData) {
    await client.query(`INSERT INTO users(username,password) values($1,$2)`, [
      entry.username,
      entry.password,
    ]);
  }

  const productData: ProductType[] = [
    {
      name: "Pencil",
      price: 12,
      image:
        "https://store.storeimages.cdn-apple.com/8756/as-images.apple.com/is/MK0C2?wid=1144&hei=1144&fmt=jpeg&qlt=95&.v=1564075356758",
    },
    {
      name: "Apple",
      price: 20,

      image:
        "https://help.apple.com/assets/653964038CE3419DC307D4F8/65396404ACA9C3A85208016E/en_US/cfef5ce601689564e0a39b4773f20815.png",
    },
  ];

  for (let entry of productData) {
    await client.query(`INSERT INTO products(name,price,image) values($1,$2,$3)`, [
      entry.name,
      entry.price,
      entry.image
    ]);
  }

  console.log("seed data done")
  await client.end();
}

main();
