DROP DATABASE stripe_demo;
CREATE DATABASE stripe_demo;
\c stripe_demo 
CREATE TABLE users (
    id serial primary key,
    username varchar(64) not null,
    password varchar(64) not null,
    created_at timestamp default current_timestamp,
    updated_at timestamp default current_timestamp
);
CREATE TABLE products (
    id serial primary key,
    name varchar(64) not null,
    image varchar(255),
    price integer,
    created_at timestamp default current_timestamp,
    updated_at timestamp default current_timestamp
);
CREATE TABLE transactions (
    id serial primary key,
    user_id integer,
    FOREIGN KEY (user_id) REFERENCES users(id),
    stripe_id varchar(255),
    total integer,
    status varchar(24)
);
CREATE TABLE transaction_details(
    id serial primary key,
    transaction_id integer,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id),
    product_id integer,
    FOREIGN KEY (product_id) REFERENCES products(id),
    unit_price integer not null,
    quantity integer not null
);