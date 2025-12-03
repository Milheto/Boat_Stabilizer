#include <WiFi.h>
#include <WiFiClientSecure.h>
#include "certificados.h"
#include <MQTT.h>



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
  delay(500);
  reconectarWiFi();
  conexaoSegura.setCACert(certificado1);
  mqtt.begin("mqtt.janks.dev.br", 8883, conexaoSegura);
  mqtt.onMessage(recebeuMensagem);
  reconectarMQTT();
}

void loop() {
  reconectarWiFi();
  reconectarMQTT();
  mqtt.loop();

  //Verificando serial
  if (Serial.available() > 0) {
    String texto = Serial.readStringUntil('\n');
    texto.trim();

    // Divide em partes separadas por vírgula
    int idx = 0;
    String partes[11];  // temos 11 campos
    int start = 0;

    for (int i = 0; i < texto.length(); i++) {
      if (texto.charAt(i) == ',') {
        if (idx < 11) {
          partes[idx++] = texto.substring(start, i);
        }
        start = i + 1;
      }
    }
    // última parte (se ainda couber no array)
    if (idx < 11) {
      partes[idx] = texto.substring(start);
    }

    // Agora separa cada parte pelo ':' e converte para float
    String t_str = partes[0].substring(partes[0].indexOf(':') + 1);
    String roll_str = partes[1].substring(partes[1].indexOf(':') + 1);
    String pitch_str = partes[2].substring(partes[2].indexOf(':') + 1);
    String yaw_str = partes[3].substring(partes[3].indexOf(':') + 1);
    String gyroX_str = partes[4].substring(partes[4].indexOf(':') + 1);
    String gyroY_str = partes[5].substring(partes[5].indexOf(':') + 1);
    String gyroZ_str = partes[6].substring(partes[6].indexOf(':') + 1);
    String servoRollAngle_str = partes[7].substring(partes[7].indexOf(':') + 1);
    String servoYawAngle_str = partes[8].substring(partes[8].indexOf(':') + 1);
    String diskRollRPM_str = partes[9].substring(partes[9].indexOf(':') + 1);
    String diskYawRPM_str = partes[10].substring(partes[10].indexOf(':') + 1);

    // Converte para float
    t_val = t_str.toFloat();
    roll = roll_str.toFloat();
    pitch = pitch_str.toFloat();
    yaw = yaw_str.toFloat();
    gyroX = gyroX_str.toFloat();
    gyroY = gyroY_str.toFloat();
    gyroZ = gyroZ_str.toFloat();
    servoRollAngle = servoRollAngle_str.toFloat();
    servoYawAngle = servoYawAngle_str.toFloat();
    diskRollRPM = diskRollRPM_str.toFloat();
    diskYawRPM = diskYawRPM_str.toFloat();

    // Exemplo de JSON publicado no novo tópico
  String payload = "{";
  payload += "\"t\":" + String(t_val, 3) + ",";
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

  mqtt.publish("nautica", payload, false, 1);

  Serial.println("JSON enviado: " + payload);
  delay(1000);

    // daqui pra baixo você usa as variáveis como quiser
  }

  
}
