/*
------------------------------------------------------------------------------
Código para Controle do MPU6050, girar o disco de inércia e mandar informações
Roll CMG + Yaw CMG (2 servos espelhados)
*/

#include <PID_v1.h>
#include "Wire.h"           
#include <MPU6050_light.h>  
#include "Servo.h"

// Motores dos discos (velocidade constante)
// Roll - 2 motores
int motor_roll_esq = 11;    // Motor roll esquerdo (AJUSTE O PINO!)
int motor_roll_dir = 9;     // Motor roll direito (AJUSTE O PINO!)
// Yaw - 2 motores  
int motor_yaw_esq = 6;      // Motor yaw esquerdo (AJUSTE O PINO!)
int motor_yaw_dir = 5;      // Motor yaw direito (AJUSTE O PINO!)
int motor_speed = 135;      // Mesma velocidade pra todos

// Servos
Servo servo_roll;           // Servo de roll - pino 10
Servo servo_yaw_esq;        // Servo yaw esquerdo - pino 10 (AJUSTE!)
Servo servo_yaw_dir;        // Servo yaw direito - pino 11 (AJUSTE!)

// Posições dos servos
int servo_roll_pos;
int servo_yaw_offset = 0;   // + = cima, - = baixo

// PID ROLL
double SetP, PV, CV;
double Pk1 = 1.5;
double Ik1 = 0.05;
double Dk1 = 0.014;
PID PID1(&PV, &CV, &SetP, Pk1, Ik1, Dk1, DIRECT);

// PID YAW
double SetP_yaw, PV_yaw, CV_yaw;
double Pk_yaw = 1.2;
double Ik_yaw = 0.03;
double Dk_yaw = 0.01;
PID PID_yaw(&PV_yaw, &CV_yaw, &SetP_yaw, Pk_yaw, Ik_yaw, Dk_yaw, DIRECT);

// IMU
MPU6050 mpu(Wire);
unsigned long timer = 0;
unsigned long timer2 = 0;
unsigned long start_time = 0;

void enviaSerial() {
  float t_val = (millis() - start_time) / 1000.0;
  
  char linha[250];
  snprintf(linha, sizeof(linha),
          "t:%.3f,roll:%.3f,pitch:%.3f,yaw:%.3f,"
          "gyroX:%.3f,gyroY:%.3f,gyroZ:%.3f,"
          "servoRollAngle:%.2f,servoYawAngle:%.2f,"
          "diskRollRPM:%.1f,diskYawRPM:%.1f",
          t_val, 
          mpu.getAngleX(), mpu.getAngleY(), mpu.getAngleZ(),
          mpu.getGyroX(), mpu.getGyroY(), mpu.getGyroZ(),
          (float)(servo_roll_pos - 105),  // offset do centro
          (float)servo_yaw_offset,
          (float)motor_speed * 20.0,      // aproximação RPM
          (float)motor_speed * 20.0);

  Serial.println(linha);
}

void setup() {
  Serial.begin(9600);
  
  // Configura 4 motores
  pinMode(motor_roll_esq, OUTPUT);
  pinMode(motor_roll_dir, OUTPUT);
  pinMode(motor_yaw_esq, OUTPUT);
  pinMode(motor_yaw_dir, OUTPUT);
  analogWrite(motor_roll_esq, 113);
  analogWrite(motor_roll_dir, 113);
  analogWrite(motor_yaw_esq, 113);
  analogWrite(motor_yaw_dir, 113);
  delay(5000);

  // Servo roll
  servo_roll.attach(10);
  servo_roll.write(105);

  // Servos yaw (espelhados)
  servo_yaw_esq.attach(10);  // AJUSTE O PINO!
  servo_yaw_dir.attach(11);  // AJUSTE O PINO!
  servo_yaw_esq.write(81);   // Centro esquerdo
  servo_yaw_dir.write(84);   // Centro direito

  // PID Roll
  PID1.SetMode(AUTOMATIC);
  PID1.SetOutputLimits(-25, 25);
  PID1.SetSampleTime(10);

  // PID Yaw
  PID_yaw.SetMode(AUTOMATIC);
  PID_yaw.SetOutputLimits(-30, 30);
  PID_yaw.SetSampleTime(10);

  // IMU
  Wire.begin();
  byte status = mpu.begin();
  while (status != 0) {}
  mpu.calcOffsets();
  
  start_time = millis();
}

void loop() {
  mpu.update();
  
  if ((millis() - timer) > 10) {
    PV = mpu.getAngleY();      // Roll
    PV_yaw = mpu.getAngleZ();  // Yaw
    timer = millis();
  }

  // PID Roll
  SetP = 0.0;
  if (PV > 2 || PV < -2) {
    PID1.Compute();
  }

  // PID Yaw
  SetP_yaw = 0.0;
  if (PV_yaw > 2 || PV_yaw < -2) {
    PID_yaw.Compute();
  }

  // Atualiza servo roll
  servo_roll_pos = map(CV, -25, 25, 75, 125);
  servo_roll.write(servo_roll_pos);

  // Atualiza servos yaw (espelhados)
  servo_yaw_offset = (int)CV_yaw;
  servo_yaw_esq.write(81 - servo_yaw_offset);  // Subtrai
  servo_yaw_dir.write(84 + servo_yaw_offset);  // Soma

  // Envia telemetria
  if ((millis() - timer2) > 500) {
    enviaSerial();
    timer2 = millis();
  }

  // Liga os 4 motores
  analogWrite(motor_roll_esq, motor_speed);
  analogWrite(motor_roll_dir, motor_speed);
  analogWrite(motor_yaw_esq, motor_speed);
  analogWrite(motor_yaw_dir, motor_speed);
}
