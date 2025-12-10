#include <WiFi.h>
#include <WiFiClientSecure.h>
#include "certificados.h"
#include <MQTT.h>

HardwareSerial SerialUno(2);

// Variáveis globais
float t_val, roll, pitch, yaw;
float gyroX, gyroY, gyroZ;
float servoRollAngle, servoYawAngle;
float diskRollRPM, diskYawRPM;

WiFiClientSecure conexaoSegura;
MQTTClient mqtt(1000);  // tamanho máximo das mensagens (1000 bytes)

// Configurações da rede WiFi
const char* ssid = "Projeto";
const char* senha = "2022-11-07";

void reconectarWiFi() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.print("Conectando ao WiFi...");
    WiFi.begin(ssid, senha);
    while (WiFi.status() != WL_CONNECTED) {
      delay(500);
      Serial.print(".");
    }
    Serial.println(" conectado!");
  }
}

void reconectarMQTT() {
  if (!mqtt.connected()) {
    Serial.print("Conectando MQTT...");
    while (!mqtt.connected()) {
      mqtt.connect("1234", "aula", "zowmad-tavQez");
      Serial.print(".");
      delay(1000);
    }
    Serial.println(" conectado!");

    // Novo tópico
    mqtt.subscribe("nautica");
    mqtt.subscribe("nautica/+/parametro", 1);
  }
}

void recebeuMensagem(String topico, String conteudo) {
  Serial.println(topico + ": " + conteudo);
}

void setup() {
  Serial.begin(115200);
  SerialUno.begin(38400, SERIAL_8N1, 16, 17);  // 16 RX, 17 TX
  delay(500);
  reconectarWiFi();
  conexaoSegura.setCACert(certificado1);
  mqtt.begin("mqtt.janks.dev.br", 8883, conexaoSegura);
  mqtt.onMessage(recebeuMensagem);
  reconectarMQTT();

  bool testeIniOK = mqtt.publish("nautica", "{\"teste\":123}", false, 0);
  Serial.print("Publish Inicial");
  Serial.print(testeIniOK ? " OK" : " FAIL");
}

void loop() {
  reconectarWiFi();
  reconectarMQTT();
  mqtt.loop();

  //Verificando serial
  if (SerialUno.available() > 0) {
    String texto = SerialUno.readStringUntil('\n');
    Serial.println("Recebido do Uno: " + texto);
    texto.trim();

    // Divide em partes separadas por vírgula
    int idx = 0;
    String partes[11];
    int start = 0;

    for (int i = 0; i < texto.length(); i++) {
      if (texto.charAt(i) == ',') {
        if (idx < 11) {
          partes[idx++] = texto.substring(start, i);
        }
        start = i + 1;
      }
    }
    if (idx < 11) {
      partes[idx] = texto.substring(start);
    }

    // Converte direto para float (sem indexOf)
    t_val = partes[0].toFloat();
    roll = partes[1].toFloat();
    pitch = partes[2].toFloat();
    yaw = partes[3].toFloat();
    gyroX = partes[4].toFloat();
    gyroY = partes[5].toFloat();
    gyroZ = partes[6].toFloat();
    servoRollAngle = partes[7].toFloat();
    servoYawAngle = partes[8].toFloat();
    diskRollRPM = partes[9].toFloat();
    diskYawRPM = partes[10].toFloat();

    // Monta JSON
    String payload = "{";
    payload += "\"t\":" + String(t_val, 0) + ",";
    payload += "\"roll\":" + String(roll, 3) + ",";
    payload += "\"pitch\":" + String(pitch, 3) + ",";
    payload += "\"yaw\":" + String(yaw, 3) + ",";
    payload += "\"gyroX\":" + String(gyroX, 3) + ",";
    payload += "\"gyroY\":" + String(gyroY, 3) + ",";
    payload += "\"gyroZ\":" + String(gyroZ, 3) + ",";
    payload += "\"servoRollAngle\":" + String(servoRollAngle, 2) + ",";
    payload += "\"servoYawAngle\":" + String(servoYawAngle, 2) + ",";
    payload += "\"diskRollRPM\":" + String(diskRollRPM, 1) + ",";
    payload += "\"diskYawRPM\":" + String(diskYawRPM, 1);
    payload += "}";

    bool ok = mqtt.publish("nautica", payload, false, 0);  // QoS 0 para simplificar
    Serial.print("Publish Result");
    Serial.println(ok ? "OK" : "FAIL");
    Serial.println("JSON enviado: " + payload);
  }
}
