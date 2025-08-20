import pygame

# Inicializa o pygame e joysticks
pygame.init()
pygame.joystick.init()

def list_controllers():
    print("Controladores conectados:")
    for i in range(pygame.joystick.get_count()):
        joystick = pygame.joystick.Joystick(i)
        joystick.init()
        print(f"{i}: {joystick.get_name()}")

def read_controller(index=0):
    joystick = pygame.joystick.Joystick(index)
    joystick.init()
    
    running = True
    while running:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            elif event.type == pygame.JOYAXISMOTION:
                print(f"Eixo {event.axis} -> {event.value:.3f}")
            elif event.type == pygame.JOYBUTTONDOWN:
                print(f"Botão {event.button} pressionado")
            elif event.type == pygame.JOYBUTTONUP:
                print(f"Botão {event.button} solto")

if __name__ == "__main__":
    list_controllers()
    read_controller(0)  # Usa o primeiro controle
