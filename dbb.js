const mysql2 = require('mysql2/promise');

const createConnection = async () => {
    const connection = await mysql2.createConnection({
        host: "localhost",
        user: "root",
        password: "1234567",
        database: "Users",
    });

    const createDataBase = `create database if not exists Users`;
    await connection.query(createDataBase);

    const useDataBase = `use Users`;
    await connection.query(useDataBase);

    const createTable = `create table if not exists Users_info(
        user_id int auto_increment,  -- FIX 1: Comma lagaya
        user_name varchar(100) not null,
        user_email varchar(100) not null,
        user_phone char(12) not null,
        user_message varchar(500) not null,
        constraint pk_Users_info primary key(user_id),
        constraint uq_Users_info unique(user_phone) -- FIX 2: constrint ko constraint kiya
    )`;
    await connection.query(createTable);

    const createTableAccount = `create table if not exists accounts(
        account_id int auto_increment,
        account_name varchar(50) not null,
        account_email varchar(50) not null,
        account_password varchar(255) not null,
        constraint pk_accounts primary key(account_id),
        constraint uq_accounts unique(account_email)
    )`;
    await connection.query(createTableAccount);

    return connection;
}

module.exports = createConnection;