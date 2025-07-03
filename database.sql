CREATE DATABASE IF NOT EXISTS transport;
USE transport;

CREATE TABLE transport_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    serial_no VARCHAR(20),
    date DATE NOT NULL,
    dc_no VARCHAR(50) NOT NULL,
    vehicle_no VARCHAR(50) NOT NULL,
    material VARCHAR(100) NOT NULL,
    loading_point VARCHAR(100) NOT NULL,
    unloading_point VARCHAR(100) NOT NULL,
    weight FLOAT NOT NULL,
    rate FLOAT NOT NULL,
    amount FLOAT AS (weight * rate / 1000) STORED,
    contractor VARCHAR(100) NOT NULL,
    dc_image VARCHAR(255),
    unloading_weight_bill_image VARCHAR(255),
    loading_weight_bill_image VARCHAR(255)
);

CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    contractor VARCHAR(100) NOT NULL,
    amount_paid FLOAT NOT NULL,
    date DATE NOT NULL
);
