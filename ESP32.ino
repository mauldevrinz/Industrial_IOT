#include <Wire.h>
#include <Adafruit_ADXL345_U.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_BMP280.h>
#include <ArduinoJson.h>

// Inisialisasi sensor
Adafruit_ADXL345_Unified adxl = Adafruit_ADXL345_Unified(12345);
Adafruit_MPU6050 mpu;
Adafruit_BMP280 bmp;

// Timing untuk pembacaan sensor
unsigned long lastRead = 0;
const unsigned long readInterval = 300; // Baca setiap 300ms

void setup() {
  Serial.begin(115200);
  while (!Serial) delay(10);
  
  Wire.begin();
  
  // Inisialisasi ADXL345
  if (!adxl.begin()) {
    Serial.println("{\"error\":\"ADXL345 tidak terdeteksi\"}");
  } else {
    adxl.setRange(ADXL345_RANGE_16_G);
  }
  
  // Inisialisasi MPU6050
  if (!mpu.begin()) {
    Serial.println("{\"error\":\"MPU6050 tidak terdeteksi\"}");
  } else {
    mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
    mpu.setGyroRange(MPU6050_RANGE_500_DEG);
    mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
  }
  
  // Inisialisasi BMP280
  if (!bmp.begin(0x76)) { // Coba alamat 0x76, jika gagal coba 0x77
    if (!bmp.begin(0x77)) {
      Serial.println("{\"error\":\"BMP280 tidak terdeteksi\"}");
    }
  } else {
    bmp.setSampling(Adafruit_BMP280::MODE_NORMAL,
                    Adafruit_BMP280::SAMPLING_X2,
                    Adafruit_BMP280::SAMPLING_X16,
                    Adafruit_BMP280::FILTER_X16,
                    Adafruit_BMP280::STANDBY_MS_500);
  }
  
  delay(100);
}

void loop() {
  unsigned long currentMillis = millis();
  
  if (currentMillis - lastRead >= readInterval) {
    lastRead = currentMillis;
    
    // Buat JSON document dengan kapasitas yang cukup
    StaticJsonDocument<512> doc;
    
    // Tambahkan timestamp
    doc["timestamp"] = currentMillis;
    
    // Baca ADXL345
    sensors_event_t event;
    if (adxl.getEvent(&event)) {
      JsonObject adxl_data = doc.createNestedObject("adxl345");
      adxl_data["ax"] = event.acceleration.x;
      adxl_data["ay"] = event.acceleration.y;
      adxl_data["az"] = event.acceleration.z;
    }
    
    // Baca MPU6050
    sensors_event_t accel, gyro, temp;
    if (mpu.getEvent(&accel, &gyro, &temp)) {
      JsonObject mpu_data = doc.createNestedObject("mpu6050");
      
      JsonObject accel_data = mpu_data.createNestedObject("accel");
      accel_data["x"] = accel.acceleration.x;
      accel_data["y"] = accel.acceleration.y;
      accel_data["z"] = accel.acceleration.z;
      
      JsonObject gyro_data = mpu_data.createNestedObject("gyro");
      gyro_data["x"] = gyro.gyro.x;
      gyro_data["y"] = gyro.gyro.y;
      gyro_data["z"] = gyro.gyro.z;
      
      mpu_data["temp"] = temp.temperature;
    }
    
    // Baca BMP280
    JsonObject bmp_data = doc.createNestedObject("bmp280");
    bmp_data["temp"] = bmp.readTemperature();
    bmp_data["pressure"] = bmp.readPressure() / 100.0F; // hPa
    bmp_data["altitude"] = bmp.readAltitude(1013.25); // Altitude dalam meter
    
    // Kirim JSON ke Serial
    serializeJson(doc, Serial);
    Serial.println(); // Newline sebagai delimiter
  }
}