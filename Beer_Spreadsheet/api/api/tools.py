def calculate_overall_beer_rating(taste, value, texture, packaging):
    return (taste + value + texture + packaging) / 135 * 100


def calculate_overall_cider_rating(taste, value, texture, packaging):
    return (taste + value + texture + packaging) / 135 * 100

def calculate_overall_wine_rating(taste, value, sessionability, packaging):
    return (taste + value + sessionability + packaging) / 135 * 100


def calculate_overall_rating(taste, value, texture_or_sessionability, packaging):
    return (taste + value + texture_or_sessionability + packaging) / 135 * 100