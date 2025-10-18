# Integration Scripts

Script-script Python untuk mengintegrasikan IIOT Dashboard dengan sistem kontrol industri.

## 📋 Daftar Script

### 1. openplc_bridge.py
Bridge untuk membaca data dari OpenPLC via Modbus TCP dan publish ke MQTT.

**Fitur:**
- Membaca Holding Registers, Input Registers, dan Coils
- Auto-reconnect jika koneksi putus
- Configurable scale factors
- Support untuk menerima commands dari dashboard

**Cara Pakai:**
```bash
# Edit konfigurasi di script
nano openplc_bridge.py

# Jalankan
python3 openplc_bridge.py
```

### 2. scada_db_bridge.py
Bridge untuk membaca data dari database SCADA (MySQL/PostgreSQL) dan publish ke MQTT.

**Fitur:**
- Mendukung MySQL (ScadaBR) dan PostgreSQL
- Query optimization dengan caching
- Configurable tag mapping
- Change detection untuk efficiency

**Cara Pakai:**
```bash
# Edit konfigurasi di script
nano scada_db_bridge.py

# Jalankan
python3 scada_db_bridge.py
```

## 🔧 Installation

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Pastikan MQTT broker sudah running:
```bash
sudo systemctl status mosquitto
```

3. Edit konfigurasi di masing-masing script sesuai setup Anda

4. Test koneksi:
```bash
# Test MQTT
mosquitto_sub -h localhost -t "iiot/#" -v

# Test OpenPLC Modbus (install mbpoll)
mbpoll -a 1 -r 0 -c 10 192.168.1.10

# Test Database
mysql -h localhost -u scada_user -p -e "SHOW TABLES;"
```

## 🚀 Menjalankan sebagai Service

### Systemd Service untuk OpenPLC Bridge

1. Create service file:
```bash
sudo nano /etc/systemd/system/openplc-bridge.service
```

2. Paste konfigurasi:
```ini
[Unit]
Description=OpenPLC to MQTT Bridge
After=network.target mosquitto.service

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/IIOT/integration-scripts
ExecStart=/usr/bin/python3 /home/pi/IIOT/integration-scripts/openplc_bridge.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

3. Enable dan start service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable openplc-bridge
sudo systemctl start openplc-bridge
sudo systemctl status openplc-bridge
```

4. View logs:
```bash
sudo journalctl -u openplc-bridge -f
```

### Sama untuk SCADA DB Bridge

```bash
sudo nano /etc/systemd/system/scada-bridge.service
```

```ini
[Unit]
Description=SCADA Database to MQTT Bridge
After=network.target mosquitto.service mysql.service

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/IIOT/integration-scripts
ExecStart=/usr/bin/python3 /home/pi/IIOT/integration-scripts/scada_db_bridge.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

## 📊 Data Flow

```
┌──────────────┐
│   OpenPLC    │
│  (Modbus)    │
└──────┬───────┘
       │
       │ Modbus TCP (502)
       ↓
┌──────────────────┐
│ openplc_bridge   │
│     (Python)     │
└──────┬───────────┘
       │
       │ MQTT (1883)
       ↓
┌──────────────────┐      ┌──────────────┐
│  MQTT Broker     │◄─────│ scada_bridge │
│  (Mosquitto)     │      │   (Python)   │
└──────┬───────────┘      └──────▲───────┘
       │                          │
       │ WebSocket (8080)         │ SQL
       ↓                          │
┌──────────────────┐      ┌──────────────┐
│  IIOT Dashboard  │      │ SCADA DB     │
│    (React)       │      │ (MySQL/PG)   │
└──────────────────┘      └──────────────┘
```

## 🔐 Security Notes

1. **MQTT Authentication**: Enable authentication di mosquitto
```bash
sudo mosquitto_passwd -c /etc/mosquitto/passwd username
```

2. **Database Access**: Buat user khusus untuk bridge dengan read-only access
```sql
CREATE USER 'bridge_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT SELECT ON scadabr.* TO 'bridge_user'@'localhost';
FLUSH PRIVILEGES;
```

3. **Firewall**: Hanya allow port yang diperlukan
```bash
sudo ufw allow 1883/tcp  # MQTT
sudo ufw allow 502/tcp   # Modbus
```

## 🐛 Troubleshooting

### OpenPLC Bridge tidak connect

1. Check OpenPLC IP:
```bash
ping 192.168.1.10
```

2. Test Modbus port:
```bash
nc -zv 192.168.1.10 502
```

3. Enable Modbus di OpenPLC Runtime:
   - Login ke web interface (port 8080)
   - Settings > Enable Modbus Server

### SCADA DB Bridge error

1. Check database credentials:
```bash
mysql -h localhost -u scada_user -p
```

2. Verify table structure:
```sql
SHOW TABLES;
DESCRIBE dataPoints;
DESCRIBE pointValues;
```

3. Check if data exists:
```sql
SELECT COUNT(*) FROM pointValues;
```

### MQTT tidak publish

1. Check mosquitto logs:
```bash
sudo tail -f /var/log/mosquitto/mosquitto.log
```

2. Test publish manual:
```bash
mosquitto_pub -h localhost -t "test" -m "hello"
mosquitto_sub -h localhost -t "test"
```

## 📚 Additional Resources

- [OpenPLC Documentation](https://www.openplcproject.com/reference)
- [Modbus Protocol Specification](https://modbus.org/docs/Modbus_Application_Protocol_V1_1b3.pdf)
- [MQTT Protocol](https://mqtt.org/mqtt-specification/)
- [ScadaBR Documentation](http://www.scadabr.com.br/?q=node/1)

## 📝 License

MIT License - Feel free to modify and use in your projects
