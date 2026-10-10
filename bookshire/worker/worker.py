import time

def run():
    while True:
        print("worker running...")
        time.sleep(5)

if __name__ == "__main__":
    run()