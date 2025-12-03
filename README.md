## Sobre o projeto

Este projeto foi desenvolvido no contexto da disciplina **ENG4033 – Projeto e Programação de Microcontroladores**, ministrada pelo professor **Jan K. S.**  

A proposta surgiu a partir de uma parceria da disciplina com a empresa de embarcações **Oceânica**, que atua na área de operações marítimas e offshore.

O objetivo é construir um **barco estabilizador em escala reduzida**, capaz de **simular uma embarcação de apoio** utilizada em operações de mergulho ou em manutenções que exigem **alta estabilidade**.  

A ideia é que o protótipo represente um barco de apoio que consiga manter-se o mais estável possível enquanto:
- ocorre o **embarque e desembarque de mergulhadores**, ou  
- são realizados **pequenos reparos e intervenções** em estruturas próximas à superfície.

---

## Escopo do projeto

Inicialmente, o grupo optou também pelo desenvolvimento de um **simulador de ondas** para auxiliar os testes e a aplicação final.  

Com isso, o trabalho foi dividido em **três frentes principais**:

1. **Gerador de ondas**  
   - Projeto mecânico e de software de um sistema capaz de gerar ondas controladas para os testes.  

2. **Integração eletrônica e controle**  
   - Integração dos sensores com os microcontroladores.  
   - Implementação e testes de controle **PID**.  
   - Desenvolvimento da **interface gráfica** e da parte de comunicação.  

3. **Protótipo mecânico do barco**  
   - Construção mecânica do **protótipo de testes** e do **barco estabilizador** em si.

Cada frente ficou sob responsabilidade de um ou mais membros do grupo, garantindo a divisão de tarefas entre mecânica, eletrônica, controle e software.

---

## Arquitetura do sistema de estabilização

Foi definido que o barco se estabilizaria por meio de **discos de inércia**, contando com **dois discos**, cada um acoplado a um **servo motor**, para correção dos movimentos de **roll** e **yaw**.

A arquitetura eletrônica é composta por:

- **MPU6050**  
  Utilizado para mapear a atitude da embarcação (ângulos e acelerações).

- **Arduino Uno**  
  Responsável por:
  - Ler os dados do MPU6050;  
  - Controlar os **servos MG996R** associados aos discos de inércia;  
  - Controlar a velocidade do motor **brushless BL2830/11** que aciona o disco de inércia;  
  - Enviar, via Serial, os dados processados e estados de controle para o **ESP32**.

- **ESP32 + MQTT**  
  O ESP32 recebe as informações do Arduino via Serial e:
  - Envia os dados para um servidor utilizando o protocolo **MQTT**;  
  - Disponibiliza essas informações para a **interface gráfica** do grupo.

A **interface gráfica** atua como painel de monitoramento e histórico, permitindo:
- visualizar o **estado atual do barco**,  
- acompanhar as **correções de controle** aplicadas,  
- e **simular graficamente** uma embarcação com as mesmas movimentações, em tempo quase real — mesmo sem contato visual direto com o protótipo.

---

## Gerador de ondas

O **gerador de ondas** foi construído utilizando:
- estrutura em **tubos de PVC**,  
- um **servo motor MG996R**,  
- e um **Arduino Uno** para controle.

Esse sistema tem como objetivo criar **perturbações controladas** na água, permitindo testar o desempenho do sistema de estabilização em diferentes condições de “mar”, de forma reprodutível e segura em ambiente de laboratório.
