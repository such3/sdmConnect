c++ ```
/\*

- Name: Sucheendra Bhat K S
- USN: 2SD23IS051
- Course: 3rd Sem, Information Science Engineering
- SDMCET
  \*/

  #include <stdio.h>
  #include <stdlib.h>
  #include <string.h>

#define MAX_SIZE 10
#define STRING_LEN 10

// Node structure to hold the data (strings)
typedef struct Node {
char data[STRING_LEN];
struct Node \*next;
} Node;

// Queue structure that holds the front, rear, and size
typedef struct {
Node *front;
Node *rear;
int size;
} Queue;

// Main structure that holds 3 queues
typedef struct {
Queue queue1;
Queue queue2;
Queue queue3;
} MainStruct;

// Function to initialize a queue (make it empty)
void initializeQueue(Queue \*q) {
q->front = q->rear = NULL;
q->size = 0;
}

// Function to initialize the main structure (initialize all queues)
void initialize(MainStruct \*ms) {
initializeQueue(&ms->queue1);
initializeQueue(&ms->queue2);
initializeQueue(&ms->queue3);
}

// Function to add a string to the queue (push operation)
void pushQueue(Queue *q, const char *str) {
Node _newNode = (Node _)malloc(sizeof(Node));
if (!newNode) {
printf("Memory allocation failed!\n");
return;
}

    strcpy(newNode->data, str);
    newNode->next = NULL;

    if (q->front == NULL) {
        q->front = q->rear = newNode;
    } else {
        q->rear->next = newNode;
        q->rear = newNode;
    }

    q->size++;
    printf("Pushed '%s' into the queue. Current size: %d\n", str, q->size);

}

// Function to remove a string from the queue (pop operation)
int popQueue(Queue *q, char *result) {
if (q->size == 0) {
return 0;
}

    Node *temp = q->front;
    strcpy(result, temp->data);
    q->front = q->front->next;

    if (q->front == NULL) {
        q->rear = NULL;
    }

    free(temp);
    q->size--;
    return 1;

}

// Function to free all memory used by the queue (used when exiting)
void freeQueue(Queue \*q) {
char result[STRING_LEN];
while (popQueue(q, result)) {
}
}

// Function to print the size of all queues (for the menu option)
void printMainStructStatus(MainStruct \*ms) {
printf("Queue 1 size: %d\n", ms->queue1.size);
printf("Queue 2 size: %d\n", ms->queue2.size);
printf("Queue 3 size: %d\n", ms->queue3.size);
}

// Main menu function where the user interacts with the queues
void menu() {
MainStruct ms;
initialize(&ms);

    int choice;
    do {
        printf("\nMenu:\n");
        printf("1. Push a string to a queue\n");
        printf("2. Pop a string from all queues\n");
        printf("3. Check if Queue 1 is empty\n");
        printf("4. Check if Queue 2 is empty\n");
        printf("5. Check if Queue 3 is empty\n");
        printf("6. Check if the main structure is empty\n");
        printf("7. Check if the main structure is full\n");
        printf("8. Print the current size of each queue\n");
        printf("9. Exit\n");
        printf("Enter your choice: ");
        scanf("%d", &choice);

        switch (choice) {
            case 1: {
                int queueNum;
                char str[STRING_LEN];

                printf("Enter queue number (1, 2, or 3): ");
                scanf("%d", &queueNum);

                if (queueNum < 1 || queueNum > 3) {
                    printf("Invalid queue number! Please enter 1, 2, or 3.\n");
                    break;
                }

                Queue *q = (queueNum == 1) ? &ms.queue1 : (queueNum == 2) ? &ms.queue2 : &ms.queue3;

                if (q->size == MAX_SIZE) {
                    printf("Queue %d is full! Cannot push new data.\n", queueNum);
                    break;
                }

                printf("Enter a string to push (max %d characters): ", STRING_LEN - 1);
                scanf("%s", str);
                pushQueue(q, str);
                break;
            }
            case 2: {
                char result[STRING_LEN];
                int queueProcessed = 0;

                if (ms.queue1.size == 0) {
                    printf("Queue 1 is empty.\n");
                } else {
                    while (popQueue(&ms.queue1, result)) {
                        printf("Queue 1: %s (Remaining size: %d)\n", result, ms.queue1.size);
                        queueProcessed = 1;
                    }
                }

                if (ms.queue2.size == 0) {
                    printf("Queue 2 is empty.\n");
                } else {
                    while (popQueue(&ms.queue2, result)) {
                        printf("Queue 2: %s (Remaining size: %d)\n", result, ms.queue2.size);
                        queueProcessed = 1;
                    }
                }

                if (ms.queue3.size == 0) {
                    printf("Queue 3 is empty.\n");
                } else {
                    while (popQueue(&ms.queue3, result)) {
                        printf("Queue 3: %s (Remaining size: %d)\n", result, ms.queue3.size);
                        queueProcessed = 1;
                    }
                }

                if (!queueProcessed) {
                    printf("All queues are empty!\n");
                }
                break;
            }
            case 3: {
                if (ms.queue1.size == 0) {
                    printf("Queue 1 is empty.\n");
                } else {
                    printf("Queue 1 is not empty.\n");
                }
                break;
            }
            case 4: {
                if (ms.queue2.size == 0) {
                    printf("Queue 2 is empty.\n");
                } else {
                    printf("Queue 2 is not empty.\n");
                }
                break;
            }
            case 5: {
                if (ms.queue3.size == 0) {
                    printf("Queue 3 is empty.\n");
                } else {
                    printf("Queue 3 is not empty.\n");
                }
                break;
            }
            case 6: {
                if (ms.queue1.size == 0 && ms.queue2.size == 0 && ms.queue3.size == 0) {
                    printf("The main structure is empty.\n");
                } else {
                    printf("The main structure is not empty.\n");
                }
                break;
            }
            case 7: {
                if (ms.queue1.size == MAX_SIZE && ms.queue2.size == MAX_SIZE && ms.queue3.size == MAX_SIZE) {
                    printf("The main structure is full.\n");
                } else {
                    printf("The main structure is not full.\n");
                }
                break;
            }
            case 8:
                printMainStructStatus(&ms);
                break;
            case 9:
                printf("Exiting and freeing memory...\n");
                freeQueue(&ms.queue1);
                freeQueue(&ms.queue2);
                freeQueue(&ms.queue3);
                break;
            default: {
                printf("Invalid choice! Please enter a valid option.\n");
                break;
            }
        }
    } while (choice != 9);

}

// Main function to start the program
int main() {
menu();
return 0;
}

```

```
