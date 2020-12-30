NAME = ingestion-sdk-example

CC ?= gcc
CFLAGS ?= -Wall

MACROS += -DEI_SENSOR_AQ_STREAM=FILE
CFLAGS += -I. -Imbedtls/include -Imbedtls/crypto/include -IQCBOR/inc -IQCBOR/src -Iinc -Iinc/signing
LIB_CFILES += QCBOR/src/*.c mbedtls/library/*.c

ifeq ($(OS),Windows_NT)
	LDFLAGS += -lws2_32
endif

all: build

.PHONY: build clean

build:
	$(CC) $(MACROS) $(CFLAGS) test/main.c $(LIB_CFILES) $(LDFLAGS) -o $(NAME)

clean:
	rm $(NAME)
