#include <WiFi.h>
#include <WiFiClient.h>
#include <WiFiAP.h>
#include <WebServer.h>
#include <ESPmDNS.h>
#include <ESP32Servo.h>   // biblioteca correta para ESP32

const char *ssid = "ESPNautica";
const char *password = "MelhorGrupo";

WebServer server(80);
Servo servo;

int pos = 0;
int pos_ini = 0;
int pos_fim = 1;
int tempo_ida = 1000;
int tempo_volta = 1000;
int intervalo = 1000;
int ctrl2 = 0;
int control = 0;

String ultimoMensagem = "";

void handleRoot() {
  String html = "";
  html += "<!DOCTYPE html><html lang='pt-BR'><head><meta charset='UTF-8'><title>Configuração Servo</title></head><body>";
  html += "<center><h2>Configuração dos parâmetros</h2>";
  html += "<form action='/enviar' method='GET'>";
  html += "pos_ini: <input type='number' name='pos_ini' value='" + String(pos_ini) + "'><br><br>";
  html += "pos_fim: <input type='number' name='pos_fim' value='" + String(pos_fim) + "'><br><br>";
  html += "tempo_ida: <input type='number' name='tempo_ida' value='" + String(tempo_ida) + "'><br><br>";
  html += "tempo_volta: <input type='number' name='tempo_volta' value='" + String(tempo_volta) + "'><br><br>";
  html += "intervalo: <input type='number' name='intervalo' value='" + String(intervalo) + "'><br><br>";
  html += "ctrl2: <input type='number' name='ctrl2' value='" + String(ctrl2) + "'><br><br>";
  html += "<input type='submit' value='Enviar'>";
  html += "</form>";

  if (ultimoMensagem != "") {
    html += "<h3>Últimos valores enviados:</h3>";
    html += "<p>" + ultimoMensagem + "</p>";
    html += "<form action='/parar' method='GET'>";
    html += "<input type='submit' value='Parar'>";
    html += "</form>";
  }

  html += "</center></body></html>";
  server.send(200, "text/html", html);
}

void handleEnviar() {
  pos_ini = server.arg("pos_ini").toInt();
  pos_fim = server.arg("pos_fim").toInt();
  tempo_ida = server.arg("tempo_ida").toInt();
  tempo_volta = server.arg("tempo_volta").toInt();
  intervalo = server.arg("intervalo").toInt();
  ctrl2 = server.arg("ctrl2").toInt();

  ultimoMensagem = "pos_ini:" + String(pos_ini) +
                   ",pos_fim:" + String(pos_fim) +
                   ",tempo_ida:" + String(tempo_ida) +
                   ",tempo_volta:" + String(tempo_volta) +
                   ",intervalo:" + String(intervalo) +
                   ",ctrl2:" + String(ctrl2);

  Serial.println(ultimoMensagem);
  control = 1;

  handleRoot();
}

void handleParar() {
  // força parada imediata
  control = 0;   // desliga o movimento
  ctrl2 = 0;     // opcional, para não reativar depois

  ultimoMensagem = "Parado pelo botão";

  Serial.println("Servo parado!");
  handleRoot();
}


void setup() {
  Serial.begin(9600);

  // escolha um GPIO válido para servo (ex: 18, 19, 21, 23, 25, 26, 27, 32, 33)
  servo.attach(32);

  WiFi.softAP(ssid, password);
  IPAddress myIP = WiFi.softAPIP();
  Serial.print("SSID: ");
  Serial.println(ssid);
  Serial.print("AP IP address: ");
  Serial.println(myIP);

  if (MDNS.begin("esp32")) {
    Serial.println("MDNS responder started");
  }

  server.on("/", handleRoot);
  server.on("/enviar", handleEnviar);
  server.on("/parar", handleParar);
  server.begin();
  Serial.println("HTTP server started");
}

void loop() {
  server.handleClient();

  if (control == 1) {
    for (pos = pos_ini; pos <= pos_fim; pos++) {
      servo.write(pos);
      delay(tempo_ida / max(1, (pos_fim - pos_ini)));
    }
    for (pos = pos_fim; pos > pos_ini; pos--) {
      servo.write(pos);
      delay(tempo_volta / max(1, (pos_fim - pos_ini)));
    }
    delay(intervalo);
    if (ctrl2 == 1) {
      ctrl2 = 0;
      control = 0;
    }
  }
}
