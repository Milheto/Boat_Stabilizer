#include <WiFi.h>
#include <WiFiClientSecure.h>
#include "certificados.h"
#include <MQTT.h>

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
    mqtt.subscribe("teste_guilherme");                 
    mqtt.subscribe("teste_guilherme/+/parametro", 1);  
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

  // Exemplo de JSON publicado no novo tópico
  String payload = "{";
  payload += "\"t\":0.123,";
  payload += "\"roll\":5.2,";
  payload += "\"pitch\":0.1,";
  payload += "\"yaw\":-3.5,";
  payload += "\"gyroX\":2.1,";
  payload += "\"gyroY\":0.0,";
  payload += "\"gyroZ\":-1.5,";
  payload += "\"servoRollAngle\":10.0,";
  payload += "\"servoYawAngle\":-8.0,";
  payload += "\"diskRollRPM\":6000,";
  payload += "\"diskYawRPM\":6000";
  payload += "}";

  mqtt.publish("teste_guilherme", payload, false, 1);

  Serial.println("JSON enviado: " + payload);
  delay(1000);
}
