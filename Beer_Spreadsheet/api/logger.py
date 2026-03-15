import logging


def get_logger(name: str = "api") -> logging.Logger:
    return logging.getLogger(name)
