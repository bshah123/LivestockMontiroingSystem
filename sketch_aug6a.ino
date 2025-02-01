#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_MPU6050.h>
#include <TinyGPS++.h>
#include <SoftwareSerial.h>
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>

// Create sensor and server objects
Adafruit_MPU6050 mpu;
TinyGPSPlus gps;
SoftwareSerial ss(D5, D6); // RX, TX for GPS

const char* ssid = "Loladmi"; // Your WiFi SSID
const char* password = "1234567899"; // Your WiFi Password

// Google Script Web App URL
const char* googleScriptURL = "https://script.google.com/macros/s/AKfycbx-9Od6KGrOIYHU891XHdjRuzTaj96yUzKicffb_n8TPv_gOOBZISnkiKQYUXL-y_dBPQ/exec";  // Replace with your Web App URL
String latitude = "N/A";
String longitude = "N/A";

void setup() {
  Serial.begin(9600);  // Initialize serial communication
  ss.begin(9600);      // Initialize SoftwareSerial for GPS

  // Connect to WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  Serial.println("Connected to WiFi");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());

  // Initialize I2C communication
  Wire.begin();
  
  // Add a small delay before initializing the MPU6050
  delay(100);

  // Initialize the MPU6050 sensor
  if (!mpu.begin(0x69)) {
    Serial.println("Failed to find MPU6050 chip at address 0x69");
    while(1) {
      delay(10);
    }
  } else {
    Serial.println("MPU6050 found at address 0x69");
  }

  mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
  mpu.setGyroRange(MPU6050_RANGE_500_DEG);
  mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
}

void loop() {
  // Read data from the GPS module and check if valid location data is available
  while (ss.available() > 0) {
    gps.encode(ss.read());
  }

  if (gps.location.isValid()) {
    latitude = String(gps.location.lat(), 6); // Update latitude
    longitude = String(gps.location.lng(), 6); // Update longitude
  } else {
    Serial.println("Waiting for valid GPS signal...");
    return;  // Skip the rest of the loop if GPS data is not valid
  }

  // Get MPU6050 sensor data
  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp);

  // Create JSON data string
  String jsonData = "{";
  jsonData += "\"accX\":\"" + String(a.acceleration.x) + "\","; 
  jsonData += "\"accY\":\"" + String(a.acceleration.y) + "\","; 
  jsonData += "\"accZ\":\"" + String(a.acceleration.z) + "\","; 
  jsonData += "\"gyroX\":\"" + String(g.gyro.x) + "\","; 
  jsonData += "\"gyroY\":\"" + String(g.gyro.y) + "\","; 
  jsonData += "\"gyroZ\":\"" + String(g.gyro.z) + "\","; 
  jsonData += "\"temp\":\"" + String(temp.temperature) + "\","; 
  jsonData += "\"latitude\":\"" + latitude + "\",";  
  jsonData += "\"longitude\":\"" + longitude + "\"";
  jsonData += "}";

  // Send data to Google Sheets only if GPS data is valid
  if (latitude != "N/A" && longitude != "N/A") {
    sendToGoogleSheets(jsonData);
  } else {
    Serial.println("Skipping data transmission due to invalid GPS coordinates");
  }

  // Print JSON data to Serial Monitor
  Serial.println(jsonData);

  delay(10000); // Adjust the delay as needed
}

void sendToGoogleSheets(String jsonData) {
  if (WiFi.status() == WL_CONNECTED) { // Check if WiFi is connected
    WiFiClientSecure client;
    client.setInsecure();  // Disable SSL certificate validation (not secure)
    HTTPClient http;
    
    Serial.println("Sending data to Google Sheets...");
    http.begin(client, googleScriptURL);  // Start connection
    
    http.addHeader("Content-Type", "application/json");  // Specify content type
    http.setTimeout(15000);  // Set timeout to 15 seconds

    int httpResponseCode = http.POST(jsonData);  // Send POST request
    
    Serial.print("HTTP Response Code: ");
    Serial.println(httpResponseCode);  // Print the response code
    
    if (httpResponseCode > 0) {
      String response = http.getString();  // Get the response
      Serial.println("Response: " + response);  // Print the response
    } else {
      Serial.print("Error Code: ");
      Serial.println(httpResponseCode);  // Print error code
      Serial.println("Error sending POST request");
    }

    http.end();  // End the connection
  } else {
    Serial.println("WiFi not connected");
  }
}
