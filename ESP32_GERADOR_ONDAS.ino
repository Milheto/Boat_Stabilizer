#include <WiFi.h>
#include <WiFiClient.h>
#include <WiFiAP.h>
#include <WebServer.h>
#include <ESPmDNS.h>

const char *ssid = "ESPNautica";
const char *password = "MelhorGrupo";

WebServer server(80);

// Variáveis para guardar os últimos valores enviados
String ultimoMensagem = "";
String pos_ini, pos_fim, tempo_ida, tempo_volta, intervalo, ctrl2;

void handleRoot() {
  String html = "";
  html += "<!DOCTYPE html><html lang='pt-BR'><head><meta charset='UTF-8'><title>Configuração Servo</title></head><body>";
  html += "<center><h2>Configuração dos parâmetros</h2>";
  html += "<form action='/enviar' method='GET'>";
  html += "pos_ini: <input type='number' name='pos_ini' value='" + pos_ini + "'><br><br>";
  html += "pos_fim: <input type='number' name='pos_fim' value='" + pos_fim + "'><br><br>";
  html += "tempo_ida: <input type='number' name='tempo_ida' value='" + tempo_ida + "'><br><br>";
  html += "tempo_volta: <input type='number' name='tempo_volta' value='" + tempo_volta + "'><br><br>";
  html += "intervalo: <input type='number' name='intervalo' value='" + intervalo + "'><br><br>";
  html += "ctrl2: <input type='number' name='ctrl2' value='" + ctrl2 + "'><br><br>";
  html += "<input type='submit' value='Enviar'>";
  html += "</form>";

  // Se já houve envio, mostra valores e botão parar
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
  // pega os valores enviados pelo formulário
  pos_ini = server.arg("pos_ini");
  pos_fim = server.arg("pos_fim");
  tempo_ida = server.arg("tempo_ida");
  tempo_volta = server.arg("tempo_volta");
  intervalo = server.arg("intervalo");
  ctrl2 = server.arg("ctrl2");

  // monta a mensagem
  ultimoMensagem = "pos_ini:" + pos_ini +
                   ",pos_fim:" + pos_fim +
                   ",tempo_ida:" + tempo_ida +
                   ",tempo_volta:" + tempo_volta +
                   ",intervalo:" + intervalo +
                   ",ctrl2:" + ctrl2;

  Serial.println(ultimoMensagem);

  // volta para a mesma página
  handleRoot();
}

void handleParar() {
  // força ctrl2 = 1
  String mensagemParar = "pos_ini:" + pos_ini +
                         ",pos_fim:" + pos_fim +
                         ",tempo_ida:" + tempo_ida +
                         ",tempo_volta:" + tempo_volta +
                         ",intervalo:" + intervalo +
                         ",ctrl2:1";

  Serial.println(mensagemParar);

  // mantém última mensagem como "parar"
  ultimoMensagem = mensagemParar;

  handleRoot();
}

void setup() {
  Serial.begin(9600);

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
}
