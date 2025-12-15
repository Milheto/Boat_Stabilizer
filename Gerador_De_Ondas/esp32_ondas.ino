#include <WiFi.h>
#include <WiFiClient.h>
#include <WiFiAP.h>
#include <WebServer.h>
#include <ESPmDNS.h>
#include <ESP32Servo.h>

// ---------------- AP CONFIG ----------------
const char *ssid = "ESPNautica";
const char *password = "MelhorGrupo";

WebServer server(80);

// ---------------- SERVO 1 ----------------
Servo servo1;
int posicaoServo1 = 90;
int sentidoServo1 = 0;
int terminoServo1 = 0;

int posicaoInicialServo1 = 45;
int posicaoFinalServo1 = 135;
int tempoIdaServo1 = 2000;
int tempoVoltaServo1 = 2000;
int tempoParadoServo1 = 2000;

int controleServo1 = 0;

unsigned long deteccaoServo1 = 0;
unsigned long deteccaoIntervaloServo1 = 0;

// ---------------- SERVO 2 ----------------
Servo servo2;
int posicaoServo2 = 90;
int sentidoServo2 = 0;
int terminoServo2 = 0;

int posicaoInicialServo2 = 45;
int posicaoFinalServo2 = 135;
int tempoIdaServo2 = 2000;
int tempoVoltaServo2 = 2000;
int tempoParadoServo2 = 2000;

int controleServo2 = 0;

unsigned long deteccaoServo2 = 0;
unsigned long deteccaoIntervaloServo2 = 0;

// Para decidir onde voltar após submit
String destino = "#servo1";

// ---------------- HTML PAGE ----------------
void handleRoot() {

  // COPIA o HTML para uma String (agora o replace funciona)
  String html = String(R"rawliteral(
<form action="/receber_valor" method="GET">
    <div class="card" id="servo1">
        <h1 style="text-align: center; font-size: 80px">Servo 1</h1>
        <div class="barra">
            <label>Ângulo Inicial (°): <span id="valPosIniServo1">{{anguloIniServo1}}</span></label><br>
            <input id="posicaoInicialServo1" name="posicaoInicialServo1" type="range" min="0" max="180"
                value="{{anguloIniServo1}}"
                oninput="if(this.value<30)this.value=30;
                         if(parseInt(this.value)>parseInt(posicaoFinalServo1.value))this.value=posicaoFinalServo1.value;
                         valPosIniServo1.innerText=this.value;">
        </div>

        <div class="barra">
            <label>Ângulo Final (°): <span id="valPosFinServo1">{{anguloFinServo1}}</span></label><br>
            <input id="posicaoFinalServo1" name="posicaoFinalServo1" type="range" min="0" max="180"
                value="{{anguloFinServo1}}"
                oninput="if(this.value>150)this.value=150;
                         if(parseInt(this.value)<parseInt(posicaoInicialServo1.value))this.value=posicaoInicialServo1.value;
                         valPosFinServo1.innerText=this.value;">
        </div>

        <div class="barra">
            <label>Tempo de Ida (ms): <span id="valTempoIdaServo1">{{tempoIdaServo1}}</span></label><br>
            <input id="tempoIdaServo1" name="tempoIdaServo1" type="range" min="0" max="5000"
                value="{{tempoIdaServo1}}"
                oninput="valTempoIdaServo1.innerText=this.value;">
        </div>

        <div class="barra">
            <label>Tempo de Volta (ms): <span id="valTempoVoltaServo1">{{tempoVoltaServo1}}</span></label><br>
            <input id="tempoVoltaServo1" name="tempoVoltaServo1" type="range" min="0" max="5000"
                value="{{tempoVoltaServo1}}"
                oninput="valTempoVoltaServo1.innerText=this.value;">
        </div>

        <div class="barra">
            <label>Tempo Parado (ms): <span id="valTempoParadoServo1">{{tempoParadoServo1}}</span></label><br>
            <input id="tempoParadoServo1" name="tempoParadoServo1" type="range" min="0" max="5000"
                value="{{tempoParadoServo1}}"
                oninput="valTempoParadoServo1.innerText=this.value;">
        </div>

        <div class="botoes">
            <button type="submit" name="acao" value="1" class="botao-ligar">Ligar</button>
            <button type="submit" name="acao" value="0" class="botao-parar">Parar</button>
        </div>
    </div>

<!-- SERVO 2 -->
    <div class="card" id="servo2">
        <h1 style="text-align: center; font-size: 80px">Servo 2</h1>
        <div class="barra">
            <label>Ângulo Inicial (°): <span id="valPosIniServo2">{{anguloIniServo2}}</span></label><br>
            <input id="posicaoInicialServo2" name="posicaoInicialServo2" type="range" min="0" max="180"
                value="{{anguloIniServo2}}"
                oninput="if(this.value<30)this.value=30;
                         if(parseInt(this.value)>parseInt(posicaoFinalServo2.value))this.value=posicaoFinalServo2.value;
                         valPosIniServo2.innerText=this.value;">
        </div>

        <div class="barra">
            <label>Ângulo Final (°): <span id="valPosFinServo2">{{anguloFinServo2}}</span></label><br>
            <input id="posicaoFinalServo2" name="posicaoFinalServo2" type="range" min="0" max="180"
                value="{{anguloFinServo2}}"
                oninput="if(this.value>150)this.value=150;
                         if(parseInt(this.value)<parseInt(posicaoInicialServo2.value))this.value=posicaoInicialServo2.value;
                         valPosFinServo2.innerText=this.value;">
        </div>

        <div class="barra">
            <label>Tempo de Ida (ms): <span id="valTempoIdaServo2">{{tempoIdaServo2}}</span></label><br>
            <input id="tempoIdaServo2" name="tempoIdaServo2" type="range" min="0" max="5000"
                value="{{tempoIdaServo2}}"
                oninput="valTempoIdaServo2.innerText=this.value;">
        </div>

        <div class="barra">
            <label>Tempo de Volta (ms): <span id="valTempoVoltaServo2">{{tempoVoltaServo2}}</span></label><br>
            <input id="tempoVoltaServo2" name="tempoVoltaServo2" type="range" min="0" max="5000"
                value="{{tempoVoltaServo2}}"
                oninput="valTempoVoltaServo2.innerText=this.value;">
        </div>

        <div class="barra">
            <label>Tempo Parado (ms): <span id="valTempoParadoServo2">{{tempoParadoServo2}}</span></label><br>
            <input id="tempoParadoServo2" name="tempoParadoServo2" type="range" min="0" max="5000"
                value="{{tempoParadoServo2}}"
                oninput="valTempoParadoServo2.innerText=this.value;">
        </div>

        <div class="botoes">
            <button type="submit" name="acao" value="3" class="botao-ligar">Ligar</button>
            <button type="submit" name="acao" value="2" class="botao-parar">Parar</button>
        </div>
    </div>

<!-- GERAL -->
    <div class="card" id="geral">
        <h1 style="text-align: center; font-size: 80px">Comando Geral</h1>
        <div class="botoes">
            <button type="submit" name="acao" value="5" class="botao-ligar">Ligar</button>
            <button type="submit" name="acao" value="4" class="botao-parar">Parar</button>
        </div>
    </div>
</form>

<style>
    .card {
        background:#fff;
        padding:20px;
        border-radius:15px;
        margin:20px auto;
        box-shadow:0 4px 10px #0002;
        width: calc(100% - 40px);
    }
    .barra{margin-bottom:35px;margin-top:15px;margin-left:80px}
    .barra input[type="range"] {
        margin-top: 15px;
    }
    .barra label {font-size: 25px}
    input[type="range"] {
        appearance: none;
        width: calc(100% - 120px);
        background: #ccc;
        height: 12px;
        border-radius: 3px;
    }
    input[type="range"]::-webkit-slider-thumb {
        appearance: none;
        width: 30px;
        height: 30px;
        background: #12ab;
        border-radius: 50%;
        cursor: pointer;
    }
    .botoes{display:flex;gap:20%;justify-content:center;margin:80px;}
    .botao-ligar,.botao-parar{
        width:200px;height:200px;border-radius:50%;border:none;
        font-size:22px;color:#fff;cursor:pointer;
    }
    .botao-ligar{background:#279918;}
    .botao-parar{background:#bd3c38;}
</style>
)rawliteral");

  // substituições
  html.replace("{{anguloIniServo1}}", String(posicaoInicialServo1));
  html.replace("{{anguloFinServo1}}", String(posicaoFinalServo1));
  html.replace("{{tempoIdaServo1}}", String(tempoIdaServo1));
  html.replace("{{tempoVoltaServo1}}", String(tempoVoltaServo1));
  html.replace("{{tempoParadoServo1}}", String(tempoParadoServo1));

  html.replace("{{anguloIniServo2}}", String(posicaoInicialServo2));
  html.replace("{{anguloFinServo2}}", String(posicaoFinalServo2));
  html.replace("{{tempoIdaServo2}}", String(tempoIdaServo2));
  html.replace("{{tempoVoltaServo2}}", String(tempoVoltaServo2));
  html.replace("{{tempoParadoServo2}}", String(tempoParadoServo2));

  server.send(200, "text/html", html);
}


// ---------------- HANDLE SUBMIT ----------------
void handleBotao() {
  Serial.println("Botao apertado");
  int acao = server.arg("acao").toInt();

  switch (acao) {

    case 0:  // parar servo 1
      controleServo1 = 0;
      destino = "#servo1";
      break;

    case 1:  // ligar servo 1
      posicaoInicialServo1 = server.arg("posicaoInicialServo1").toInt();
      posicaoFinalServo1 = server.arg("posicaoFinalServo1").toInt();
      tempoIdaServo1 = server.arg("tempoIdaServo1").toInt();
      tempoVoltaServo1 = server.arg("tempoVoltaServo1").toInt();
      tempoParadoServo1 = server.arg("tempoParadoServo1").toInt();
      posicaoServo1 = posicaoInicialServo1;
      sentidoServo1 = 0;
      terminoServo1 = 0;
      controleServo1 = 1;
      destino = "#servo1";
      break;

    case 2:  // parar servo 2
      controleServo2 = 0;
      destino = "#servo2";
      break;

    case 3:  // ligar servo 2
      posicaoInicialServo2 = server.arg("posicaoInicialServo2").toInt();
      posicaoFinalServo2 = server.arg("posicaoFinalServo2").toInt();
      tempoIdaServo2 = server.arg("tempoIdaServo2").toInt();
      tempoVoltaServo2 = server.arg("tempoVoltaServo2").toInt();
      tempoParadoServo2 = server.arg("tempoParadoServo2").toInt();
      posicaoServo2 = posicaoInicialServo2;
      sentidoServo2 = 0;
      terminoServo2 = 0;
      controleServo2 = 1;
      destino = "#servo2";
      break;

    case 4:  // parar tudo
      controleServo1 = 0;
      controleServo2 = 0;
      destino = "#geral";
      break;

    case 5:  // ligar tudo
      // servo 1
      posicaoInicialServo1 = server.arg("posicaoInicialServo1").toInt();
      posicaoFinalServo1 = server.arg("posicaoFinalServo1").toInt();
      tempoIdaServo1 = server.arg("tempoIdaServo1").toInt();
      tempoVoltaServo1 = server.arg("tempoVoltaServo1").toInt();
      tempoParadoServo1 = server.arg("tempoParadoServo1").toInt();
      posicaoServo1 = posicaoInicialServo1;
      sentidoServo1 = 0;
      terminoServo1 = 0;
      controleServo1 = 1;

      // servo 2
      posicaoInicialServo2 = server.arg("posicaoInicialServo2").toInt();
      posicaoFinalServo2 = server.arg("posicaoFinalServo2").toInt();
      tempoIdaServo2 = server.arg("tempoIdaServo2").toInt();
      tempoVoltaServo2 = server.arg("tempoVoltaServo2").toInt();
      tempoParadoServo2 = server.arg("tempoParadoServo2").toInt();
      posicaoServo2 = posicaoInicialServo2;
      sentidoServo2 = 0;
      terminoServo2 = 0;
      controleServo2 = 1;

      destino = "#geral";
      break;
  }

  Serial.println(posicaoInicialServo1);
  Serial.println(controleServo1);

  // REDIRECT CORRETO
  server.sendHeader("Location", String("/") + destino);
  server.send(302);
}


// ---------------- SETUP ----------------
void setup() {
  Serial.begin(115200);
  //Serial.begin(9600);

  servo1.attach(32);
  servo2.attach(33);

  servo1.write(posicaoServo1);
  servo2.write(posicaoServo2);

  WiFi.softAP(ssid, password);
  Serial.println(WiFi.softAPIP());

  server.on("/", handleRoot);
  server.on("/receber_valor", handleBotao);

  server.begin();
  Serial.println("Server started!");
  Serial.println("Funcionando!");

  WiFi.softAP(ssid, password);
  Serial.println(WiFi.softAPIP());
}


// ---------------- LOOP ----------------
void loop() {
  server.handleClient();

  // SERVO 1 -----------------------------------------
  if (controleServo1 == 1) {

    if (terminoServo1 == 0) {

      if (sentidoServo1 == 0) {  // indo
        if (millis() > deteccaoServo1 + tempoIdaServo1 / max(1, (posicaoFinalServo1 - posicaoInicialServo1))) {
          servo1.write(posicaoServo1);
          posicaoServo1++;
          deteccaoServo1 = millis();
        }
      } else {  // voltando
        if (millis() > deteccaoServo1 + tempoVoltaServo1 / max(1, (posicaoFinalServo1 - posicaoInicialServo1))) {
          servo1.write(posicaoServo1);
          posicaoServo1--;
          deteccaoServo1 = millis();
        }
      }

      if (posicaoServo1 >= posicaoFinalServo1) sentidoServo1 = 1;
      if (posicaoServo1 <= posicaoInicialServo1) {
        if (sentidoServo1 == 1) {
          terminoServo1 = 1;
          deteccaoIntervaloServo1 = millis();
        }
        sentidoServo1 = 0;
      }
    }

    if (terminoServo1 == 1 && millis() > deteccaoIntervaloServo1 + tempoParadoServo1) {
      terminoServo1 = 0;
    }

  } else {
    servo1.write(90);
  }


  // SERVO 2 -----------------------------------------
  if (controleServo2 == 1) {

    if (terminoServo2 == 0) {

      if (sentidoServo2 == 0) {
        if (millis() > deteccaoServo2 + tempoIdaServo2 / max(1, (posicaoFinalServo2 - posicaoInicialServo2))) {
          servo2.write(posicaoServo2);
          posicaoServo2++;
          deteccaoServo2 = millis();
        }
      } else {
        if (millis() > deteccaoServo2 + tempoVoltaServo2 / max(1, (posicaoFinalServo2 - posicaoInicialServo2))) {
          servo2.write(posicaoServo2);
          posicaoServo2--;
          deteccaoServo2 = millis();
        }
      }

      if (posicaoServo2 >= posicaoFinalServo2) sentidoServo2 = 1;
      if (posicaoServo2 <= posicaoInicialServo2) {
        if (sentidoServo2 == 1) {
          terminoServo2 = 1;
          deteccaoIntervaloServo2 = millis();
        }
        sentidoServo2 = 0;
      }
    }

    if (terminoServo2 == 1 && millis() > deteccaoIntervaloServo2 + tempoParadoServo2) {
      terminoServo2 = 0;
    }

  } else {
    servo2.write(90);
  }
}
