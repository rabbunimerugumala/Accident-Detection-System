# Hardware & Firmware Dependencies

## Arduino Libraries (Install via Library Manager)
- **ArduinoJson** (>= 6.21.0) - For JSON parsing
- **Firebase_ESP_Client** (>= 4.4.0) - For Firebase Realtime DB updates
- **WiFi** (built-in) - For network connectivity
- **TinyGPS++** (>= 1.0.3) - For GPS NMEA parsing
- **Adafruit MPU6050** (>= 2.2.0) - For Accelerometer/Gyroscope
- **DHT sensor library** (>= 1.4.4) - For Temperature/Humidity
- **ESP32-CAM** (ESP32 board package v2.0.14+) - For Camera module

## Node.js Dependencies (Dashboard)
- Node.js v18+
- All npm packages are listed in `package.json`.
- Run `npm install` to install them.

## Hardware Components
| Component | Model | Purpose |
| :--- | :--- | :--- |
| Microcontroller 1 | ESP32-S3 | Main sensor fusion & GPS |
| Microcontroller 2 | ESP32-CAM | Dual-camera evidence capture |
| Accelerometer | MPU6050 | G-force/Tilt detection |
| GPS | NEO-6M | Location tracking |
| Gas Sensor | MQ2 | LPG/Smoke detection |
| Flame Sensor | 5V Digital | Fire detection |
| Water Sensor | 5V Analog | Flood/Water ingress |
| Temp/Humidity | DHT11 | Environmental monitoring |
