#include <PID_v1.h>
#include "Wire.h"
#include <MPU6050_light.h>
#include "Servo.h"
#include <SoftwareSerial.h>

// RX no pino 12, TX no pino 13 (exemplo)
// SoftwareSerial espSerial(12, 13);


// ESCs
Servo esc_yaw;
Servo esc_roll;

// Servos Yaw
Servo servo_motor_yaw_esq;
Servo servo_motor_yaw_dir;

// Servos Roll
Servo servo_motor_roll_esq;
Servo servo_motor_roll_dir;

// Parametros para mandar para o esp32
int servo_pos_esq_yaw;
int servo_pos_dir_yaw;
int servo_pos_esq_roll;
int servo_pos_dir_roll;

int yawOffset;
int rollOffset;

// PID Yaw _______________________________________________________________________________
double SetP_yaw, PV_yaw, CV_yaw;
double Pk1 = 1.5, Ik1 = 0.05, Dk1 = 0.014;
PID PID_yaw(&PV_yaw, &CV_yaw, &SetP_yaw, Pk1, Ik1, Dk1, REVERSE);

// PID Roll _______________________________________________________________________________
double SetP_roll, PV_roll, CV_roll;
double Pk2 = 1.5, Ik2 = 0.05, Dk2 = 0.014;
PID PID_roll(&PV_roll, &CV_roll, &SetP_roll, Pk2, Ik2, Dk2, REVERSE);

// IMU data
MPU6050 mpu(Wire);
unsigned long timer = 0;
unsigned long timer2 = 0;
void setup() {
  // Serial.begin(115200);
  // espSerial.begin(9600);
  Serial.begin(38400);  // por exemplo, 38400 estável
  // ESCs
  esc_yaw.attach(9);
  esc_roll.attach(3);
  esc_yaw.writeMicroseconds(1000);
  esc_roll.writeMicroseconds(1000);
  delay(5000);

  // Servos Yaw
  servo_motor_yaw_esq.attach(11);
  servo_motor_yaw_dir.attach(10);
  servo_motor_yaw_esq.write(84);
  servo_motor_yaw_dir.write(81);

  // Servos Roll
  servo_motor_roll_esq.attach(6);
  servo_motor_roll_dir.attach(5);
  servo_motor_roll_esq.write(71);
  servo_motor_roll_dir.write(86);

  // PID Yaw
  PID_yaw.SetMode(AUTOMATIC);
  PID_yaw.SetOutputLimits(-25, 25);
  PID_yaw.SetSampleTime(10);

  // PID Roll
  PID_roll.SetMode(AUTOMATIC);
  PID_roll.SetOutputLimits(-25, 25);
  PID_roll.SetSampleTime(10);

  // IMU
  Wire.begin();
  byte status = mpu.begin();
  while (status != 0) {}
  mpu.calcOffsets();
  yawOffset = mpu.getAngleZ();
  rollOffset = mpu.getAngleY();
}

void loop() {
  mpu.update();
  if ((millis() - timer) > 10) {
    PV_yaw = (mpu.getAngleZ() - yawOffset);
    PV_roll = (mpu.getAngleY() - rollOffset);
    timer = millis();
  }

  // PID Yaw
  SetP_yaw = 0.0;
  if (PV_yaw > 2 || PV_yaw < -2) {
    PID_yaw.Compute();
  }

  // PID Roll
  SetP_roll = 0.0;
  if (PV_roll > 2 || PV_roll < -2) {
    PID_roll.Compute();
  }

  // Servos Yaw
  servo_pos_esq_yaw = map(CV_yaw, -25, 25, 59, 109);
  servo_pos_dir_yaw = map(CV_yaw, -25, 25, 106, 56);
  servo_motor_yaw_esq.write(servo_pos_esq_yaw);
  servo_motor_yaw_dir.write(servo_pos_dir_yaw);

  // Servos Roll
  servo_pos_esq_roll = map(CV_roll, -25, 25, 46, 96);   // centro 71
  servo_pos_dir_roll = map(CV_roll, -25, 25, 111, 61);  // centro 86
  servo_motor_roll_esq.write(servo_pos_esq_roll);
  servo_motor_roll_dir.write(servo_pos_dir_roll);


  // Motores
  esc_yaw.writeMicroseconds(1152);
  esc_roll.writeMicroseconds(1152);

  // Monta string para ESP32
  // if ((millis() - timer2) > 500) {

  //   espSerial.print(millis());
  //   espSerial.print(",");
  //   espSerial.print(mpu.getAngleY());
  //   espSerial.print(",");
  //   espSerial.print(mpu.getAngleX());
  //   espSerial.print(",");
  //   espSerial.print(mpu.getAngleZ());
  //   espSerial.print(",");
  //   espSerial.print(mpu.getGyroX());
  //   espSerial.print(",");
  //   espSerial.print(mpu.getGyroY());
  //   espSerial.print(",");
  //   espSerial.print(mpu.getGyroZ());
  //   espSerial.print(",");
  //   espSerial.print(servo_pos_esq_roll);  // ou média dos dois servos
  //   espSerial.print(",");
  //   espSerial.print(servo_pos_esq_yaw);
  //   espSerial.print(",");
  //   espSerial.print(1100);  // valor do ESC roll
  //   espSerial.print(",");
  //   espSerial.println(1100);  // valor do ESC yaw
  //   timer2 = millis();
  // }
  if ((millis() - timer2) > 500) {
    Serial.print(millis());
    Serial.print(",");
    Serial.print(mpu.getAngleY());
    Serial.print(",");
    Serial.print(mpu.getAngleX());
    Serial.print(",");
    Serial.print(mpu.getAngleZ());
    Serial.print(",");
    Serial.print(mpu.getGyroX());
    Serial.print(",");
    Serial.print(mpu.getGyroY());
    Serial.print(",");
    Serial.print(mpu.getGyroZ());
    Serial.print(",");
    Serial.print(servo_pos_esq_roll);
    Serial.print(",");
    Serial.print(servo_pos_esq_yaw);
    Serial.print(",");
    Serial.print(1100);  // ESC roll
    Serial.print(",");
    Serial.println(1100);  // ESC yaw
    timer2 = millis();
  }
}
