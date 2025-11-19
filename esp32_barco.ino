#include <WiFi.h>
#include <WiFiClient.h>
#include <WiFiAP.h>
#include <WebServer.h>
#include <ESPmDNS.h>

#define LED_BUILTIN 2  //Configura o pino do LED embutido
float ultimoAngulo = 0.0;
//Configuração da rede
const char *ssid = "ESPNautica";
const char *password = "MelhorGrupo";

//iniciação do servidor
WebServer server(80);
float rollAngle = 0.0;
float yawAngle = 0.0;

void handleRoot();


void setup() {
  //iniciação da serial
  Serial.begin(9600);  // Configura a comunicação serial para 9600 bauds
  Serial.setTimeout(10);

  //D2 como saída
  pinMode(LED_BUILTIN, OUTPUT);

  //configuracao do wifi
  WiFi.softAP(ssid, password);
  IPAddress myIP = WiFi.softAPIP();
  Serial.print("SSID: ");
  Serial.println(ssid);
  Serial.print("AP IP address: ");
  Serial.println(myIP);
  server.begin();

  Serial.println("Servidor Iniciado");
  if (MDNS.begin("esp32")) {
    Serial.println("MDNS responder started");
  }

  server.on("/", handleRoot);

  server.on("/on", handleOn);

  server.on("/off", handleOff);

  server.on("/estado", handleEstado);

  server.onNotFound(handleNotFound);

  server.begin();
  Serial.println("HTTP server started");
}

void handleRoot() {
  String html = "";

  html += "<!DOCTYPE html>";
  html += "<html lang='pt-BR'>";
  html += "<head>";
  html += "<meta charset='UTF-8'>";
  html += "<title>Roll &amp; Yaw</title>";
  html += "</head>";
  html += "<body>";
  html += "<center>";

  // ROLL
  html += "<h2>Roll: <span id='roll'>";
  html += String(rollAngle, 1);
  html += "&deg;</span></h2>";

  // YAW
  html += "<h2>Yaw: <span id='yaw'>";
  html += String(yawAngle, 1);
  html += "&deg;</span></h2>";

  html += "</center>";

  html += "<script>";
  html += "function atualizar(){";
  html += "  fetch('/estado').then(r => r.json()).then(d => {";
  html += "    document.getElementById('roll').innerHTML = d.roll.toFixed(1) + '&deg;';";
  html += "    document.getElementById('yaw').innerHTML = d.yaw.toFixed(1) + '&deg;';";
  html += "  }).catch(e => {});";
  html += "}";
  html += "setInterval(atualizar, 500);";
  html += "atualizar();";
  html += "</script>";

  html += "</body>";
  html += "</html>";

  server.send(200, "text/html", html);
}





void handleOn() {
  digitalWrite(LED_BUILTIN, 1);
  handleRoot();
}

void handleOff() {
  digitalWrite(LED_BUILTIN, 0);
  handleRoot();
}

void handleNotFound() {
  digitalWrite(LED_BUILTIN, 1);
  String message = "File Not Found \n\n";
  message += "URI: ";
  message += server.uri();
  message += "\nMethod: ";
  message += (server.method() == HTTP_GET) ? "GET" : "POST";
  message += "\nArguments: ";
  message += server.args();
  message += "\n";
  for (uint8_t i = 0; i < server.args(); i++) {
    message += " " + server.argName(i) + ": " + server.arg(i) + "\n";
  }
  server.send(404, "text/plain", message);
  digitalWrite(LED_BUILTIN, 0);
}

void handleEstado() {
  String json = "{";
  json += "\"roll\":" + String(rollAngle, 1) + ",";
  json += "\"yaw\":"  + String(yawAngle, 1);
  json += "}";
  server.send(200, "application/json", json);
}

void loop() {
  if (Serial.available()) {
    // Lê o byte recebido
    String texto = Serial.readString();
    texto.trim();
    // Imprime a mensagem recebida
    if (texto != "") {
      Serial.println("Mensagem recebida: " + texto);
      int sep = texto.indexOf(':');

      if (sep != -1) {
        String s1 = texto.substring(0, sep);
        String s2 = texto.substring(sep + 1);

        int numero1 = s1.toInt();
        int numero2 = s2.toInt();

        rollAngle = numero1;
        yawAngle = numero2;

        Serial.print("numero1 = ");
        Serial.print(numero1);
        Serial.print(" | numero2 = ");
        Serial.println(numero2);
      }
    }
  }
  

  server.handleClient();
}
