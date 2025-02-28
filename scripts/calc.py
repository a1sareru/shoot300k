import argparse
from itertools import combinations, permutations, product
import pandas as pd
import os
import json


def generate_valid_sets_1bit(x):
    """
    Given a number x with only one bit set in the low 7 bits,
    find all valid sets of 4 numbers that satisfy the following conditions:
     - 2 of the numbers have 2 bits set in the low 7 bits
     - 2 of the numbers have 1 bit set in the low 7 bits
     - n1 | n2 | n3 | n4 | x == 127
    """
    FULL_MASK = 0b1111111  # The mask for the low 7 bits
    x_low = x & FULL_MASK

    # Enumerate all possible 2-bit numbers
    two_bit_numbers = [sum(1 << i for i in bits)
                       for bits in combinations(range(7), 2)]

    valid_sets = []

    # Enumerate all possible combinations of 2-bit numbers
    for two1, two2 in combinations(two_bit_numbers, 2):
        # skip if two1, two2, or x_low have common bits
        if two1 & two2 or two1 & x_low or two2 & x_low:
            continue
        # Calculate the remaining bits
        remain = FULL_MASK & ~(two1 | two2 | x_low)
        # Generate all possible combinations of 1-bit numbers accordingly
        bit_indices = [i for i in range(7) if remain & (1 << i)]
        one1 = 1 << bit_indices[0]
        one2 = 1 << bit_indices[1]
        # one[i]'s sequence does not matter
        valid_sets.append((two1, two2, one1, one2))

    return valid_sets


def generate_valid_sets_0bit():
    """
    find all valid sets of 4 numbers that satisfy the following conditions:
     - 3 of the numbers have 2 bits set in the low 7 bits
     - 1 of the numbers have 1 bit set in the low 7 bits
     - n1 | n2 | n3 | n4 == 127
    """
    FULL_MASK = 0b1111111  # The mask for the low 7 bits

    # Enumerate all possible 1-bit numbers
    one_bit_numbers = [1 << i for i in range(7)]

    # Enumerate all possible 2-bit numbers
    two_bit_numbers = [sum(1 << i for i in bits)
                       for bits in combinations(range(7), 2)]

    valid_sets = []

    # Enumerate all possible combinations of 1-bit numbers to get two1, two2, two3
    for one in one_bit_numbers:
        # Calculate the remaining bits
        remain = FULL_MASK & ~one
        # Enumerate all possible combinations of 2-bit numbers
        for index_i in range(len(two_bit_numbers)):
            if one & two_bit_numbers[index_i]:
                continue
            two1 = two_bit_numbers[index_i]
            for index_j in range(index_i + 1, len(two_bit_numbers)):
                if two1 & two_bit_numbers[index_j] or one & two_bit_numbers[index_j]:
                    continue
                two2 = two_bit_numbers[index_j]
                two3 = remain & ~(two1 | two2)

                valid_sets.append((two1, two2, two3, one))

    return valid_sets


def generate_valid_sets_2bit(x):
    """
    Given a number x with 2 bit set in the low 7 bits,
    find all valid sets of 4 numbers that satisfy the following conditions:
     - 1 of the numbers have 2 bits set in the low 7 bits
     - 3 of the numbers have 1 bit set in the low 7 bits
     - n1 | n2 | n3 | n4 | x == 127
    """
    FULL_MASK = 0b1111111  # The mask for the low 7 bits
    x_low = x & FULL_MASK

    # Enumerate all possible 2-bit numbers
    two_bit_numbers = [sum(1 << i for i in bits)
                       for bits in combinations(range(7), 2)]

    valid_sets = []

    # Enumerate all possible combinations of 2-bit numbers
    for two in two_bit_numbers:
        if (two & x_low):
            continue
        remain = FULL_MASK & ~(two | x_low)
        # remain has exactly 3 bits, so just split it into 3 1-bit numbers
        one0, one1, one2 = [1 << i for i in range(7) if (remain >> i) & 1]
        valid_sets.append([two, one0, one1, one2])

    return valid_sets


def find_solutions_2_2(A, B):
    set_A = generate_valid_sets_1bit(A)
    set_B = generate_valid_sets_1bit(B)

    # Save the indices of the permutations to avoid recomputing them
    permutations_idx = [
        (0, 2, 1, 3, 2, 0, 3, 1),
        (0, 2, 1, 3, 2, 1, 3, 0),
        (0, 3, 1, 2, 2, 0, 3, 1),
        (0, 3, 1, 2, 2, 1, 3, 0),
    ]

    solutions = []
    for a in set_A:
        for b in set_B:
            for idx in permutations_idx:
                solutions.append([
                    (a[idx[0]], b[idx[1]]),
                    (a[idx[2]], b[idx[3]]),
                    (a[idx[4]], b[idx[5]]),
                    (a[idx[6]], b[idx[7]])
                ])

    return solutions


def find_solutions_3_1(A):
    # Note: A has two bit set to 1, and 0 == B (so it is not necessary to pass B)
    set_A = generate_valid_sets_2bit(A)  # two, one1, one2, one3
    set_B = generate_valid_sets_0bit()  # two1, two2, two3, one

    # Save the indices of the permutations to avoid recomputing them
    permutations_idx = [
        (1, 0, 2, 1, 3, 2),
        (1, 0, 2, 2, 3, 1),
        (1, 1, 2, 0, 3, 2),
        (1, 1, 2, 2, 3, 0),
        (1, 2, 2, 0, 3, 1),
        (1, 2, 2, 1, 3, 0),
    ]

    solutions = []
    for a in set_A:
        for b in set_B:
            card_fixed = (a[0], b[3])
            for idx in permutations_idx:
                solutions.append([
                    card_fixed,
                    (a[idx[0]], b[idx[1]]),
                    (a[idx[2]], b[idx[3]]),
                    (a[idx[4]], b[idx[5]])
                ])
    return solutions


# Generate all possible binary codes (low 7 bits)
def generate_tag_codes():
    codes = set()

    # case: 1 tag
    for i in range(7):
        codes.add(1 << i)

    # case: 2 tags
    for i, j in combinations(range(7), 2):
        codes.add((1 << i) | (1 << j))

    return sorted(codes)


# Get color and code of a given tag
def get_tag_color_and_code(tag, all_tags):
    color = next(
        (i + 1 for i, tags in enumerate(all_tags) if tag in tags), None)
    index = all_tags[color - 1].index(tag)
    return color, 1 << index


# Main function
if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Yet another 300k deck enumerator. (not even a solver!)")
    # Arguments related to the input files
    parser.add_argument("-c", "--cards-lists", required=True,
                        help="Path to character_card.csv")
    parser.add_argument("-b", "--card-tags-base", required=True,
                        help="Path to card_give_characteristic.csv")
    parser.add_argument("-g", "--card-tags-grow", required=True,
                        help="Path to card_give_characteristic_grow_list.csv")
    parser.add_argument("-t", "--tags-all", required=True,
                        help="Path to characteristics_normal.csv")
    # Arguments related to the output files
    parser.add_argument("-o", "--output-dir", required=True,
                        help="Path to the output directory")

    args = parser.parse_args()

    # Generate all 2-tuples as color pairs (sequence does not matter)
    #
    # color range: 1-5
    # so there are 10 pairs
    questions = tuple(combinations(range(1, 6), 2))

    # Colors: 1-5
    colors = tuple(range(1, 6))

    # Encoded tag info
    tag_codes = generate_tag_codes()
    cards_encoded = {i: {} for i in range(1, 6)}

    # Generate all 2-lists as color pairs for 'i_1,i_1,i_2' cards (sequence matters)
    #
    # color range: 1-5
    # so there are 20 pairs
    color_comb = tuple(permutations(colors, 2))

    # Load all silver tags
    #
    # silver tags are the tags with rarity=3,
    # and should be divided by colors
    df_tags_all = pd.read_csv(args.tags_all)
    df_silver_tags = tuple(
        df_tags_all[df_tags_all['rarity'] == 3].groupby('color'))
    # silver_tags_int: color[i] -> (tag_id)
    silver_tags_int = tuple([tuple(df['id']) for _, df in df_silver_tags])
    silver_tags_str = tuple([tuple(map(str, df['id']))
                             for _, df in df_silver_tags])

    # Load all cards
    #
    # cards are the cards with rarity=4,3
    df_cards = pd.read_csv(args.cards_lists)
    df_cards = df_cards[df_cards['rarity'].isin([3, 4])]
    # delete SR(133, 134), since each of them only provide 1 normal silver tag
    df_cards = df_cards[~df_cards['id'].isin([133, 134])]
    # get all valid cards (SSR, SR)
    valid_cards = tuple(df_cards['id'].sort_values())

    # Load card-tag mappings from base and grow lists
    #
    # Note: the characteristics should be filtered by "silver_tags"
    #  - card_tags_base: card_id -> characteristic_id
    #  - card_tags_grow: card_id -> characteristic_id
    # Steps:
    #  - remove unnecessary columns, then merge them into a single dictionary.
    #  - filter the characteristics by "silver_tags".
    # Other data structures:
    #  - card_tags: card_id -> characteristic_id
    #  - tag_cards: characteristic_id -> card_id
    df_card_tags_base = pd.read_csv(args.card_tags_base)
    df_card_tags_base = df_card_tags_base[['card_id', 'characteristic_id']]
    df_card_tags_grow = pd.read_csv(args.card_tags_grow)
    df_card_tags_grow = df_card_tags_grow[['card_id', 'characteristic_id']]
    df_card_tags = pd.concat([df_card_tags_base, df_card_tags_grow])
    # Note: it should only consider the cards in valid_cards, and the tags in silver_tags
    df_card_tags = df_card_tags[df_card_tags['characteristic_id'].isin(
        [tag for tags in silver_tags_str for tag in tags])]
    df_card_tags = df_card_tags[df_card_tags['card_id'].isin(valid_cards)]
    # card_tags: card_id -> [characteristic_id]
    card_tags = df_card_tags['characteristic_id'].groupby(
        df_card_tags['card_id']).apply(list).to_dict()
    # tag_cards: characteristic_id -> [card_id]
    tag_cards = df_card_tags['card_id'].groupby(
        df_card_tags['characteristic_id']).apply(list).to_dict()

    # Generate encoded card info with mapping: [color][code] -> [card_id]
    for card in card_tags:
        tags = card_tags[card]
        temp_color_codes = {}
        for tag in tags:
            color, code = get_tag_color_and_code(tag, silver_tags_str)
            if color not in temp_color_codes:
                temp_color_codes[color] = 0
            temp_color_codes[color] |= code
        for color in temp_color_codes:
            if temp_color_codes[color] not in cards_encoded[color]:
                cards_encoded[color][temp_color_codes[color]] = []
            cards_encoded[color][temp_color_codes[color]].append(card)

    # Initialize the two json structures for the output
    card0_dict = {}
    quad_dict = {}

    # Iterate over all color pairs
    for color_pair in questions:
        color_1, color_2 = color_pair
        color_pair_as_key = f"{color_1},{color_2}"
        color_1_tags = silver_tags_int[color_1 - 1]
        color_2_tags = silver_tags_int[color_2 - 1]

        # Initialize the two json structures for the current color pair
        card0_dict[color_pair_as_key] = {}
        quad_dict[color_pair_as_key] = {}

        # Iterate over all tag pairs for the selected color pair
        for i in range(len(color_1_tags)):
            # This loop is for [A1, A2]
            for j in range(i + 1, len(color_1_tags)):
                tagA1, tagA2 = (1 << i), (1 << j)
                if not (set(tag_cards[str(color_1_tags[i])]) &
                        set(tag_cards[str(color_1_tags[j])])):
                    # there is no card with both tags,
                    #  so we can skip this tag pair
                    continue

                # find solutions
                flag_next = False
                quad_list = []
                for s in find_solutions_3_1(tagA1 | tagA2):
                    # add a 4-array to store the card id, each element is a list
                    tmp_quad = [[] for _ in range(4)]
                    for m in range(4):
                        intersection = set(cards_encoded[color_1][s[m][0]]) & set(
                            cards_encoded[color_2][s[m][1]])
                        if not intersection:
                            flag_next = True
                            break
                        else:
                            tmp_quad[m] = intersection

                    # if there is no card, skip this solution
                    if flag_next:
                        flag_next = False
                        continue
                    
                    for quad in product(*tmp_quad):
                        quad_list.append(sorted(quad))

                if not quad_list:
                    # there is no solution, so we can skip this tag pair
                    continue

                # generate the key for the tag pair
                tag_pair_as_key = f"{color_1_tags[i]},{color_1_tags[j]}"

                # Store the results in the corresponding json structure
                # quad_dict
                quad_dict[color_pair_as_key][tag_pair_as_key] = quad_list
                # card0_dict
                card0_dict[color_pair_as_key][tag_pair_as_key] = list(
                    set(tag_cards[str(color_1_tags[i])]) & set(tag_cards[str(color_1_tags[j])]))

            # This loop is for [A1, B1]
            for j in range(len(color_2_tags)):
                tagA, tagB = (1 << i), (1 << j)
                if not (set(tag_cards[str(color_1_tags[i])]) &
                        set(tag_cards[str(color_2_tags[j])])):
                    # there is no card with both tags,
                    #  so we can skip this tag pair
                    continue

                # find solutions
                flag_next = False
                quad_list = []
                for s in find_solutions_2_2(tagA, tagB):
                    # add a 4-array to store the card id, each element is a list
                    quad = [[] for _ in range(4)]
                    for m in range(4):
                        intersection = set(cards_encoded[color_1][s[m][0]]) & set(
                            cards_encoded[color_2][s[m][1]])
                        if not intersection or len(intersection) > 1:
                            flag_next = True
                            break
                        else:
                            quad[m] = intersection.pop()

                    # if there is no card, skip this solution
                    if flag_next:
                        flag_next = False
                        continue
                    quad_list.append(sorted(quad))

                if not quad_list:
                    # there is no solution, so we can skip this tag pair
                    continue

                # generate the key for the tag pair
                tag_pair_as_key = f"{color_1_tags[i]},{color_2_tags[j]}"

                # Store the results in the corresponding json structure
                # quad_dict: flatten it before storing
                quad_dict[color_pair_as_key][tag_pair_as_key] = quad_list
                # card0_dict
                card0_dict[color_pair_as_key][tag_pair_as_key] = list(
                    set(tag_cards[str(color_1_tags[i])]) & set(tag_cards[str(color_2_tags[j])]))

        # This loop is for [B1, B2]
        for i in range(len(color_2_tags)):
            for j in range(i + 1, len(color_2_tags)):
                tagB1, tagB2 = (1 << i), (1 << j)
                if not (set(tag_cards[str(color_2_tags[i])]) &
                        set(tag_cards[str(color_2_tags[j])])):
                    # there is no card with both tags,
                    #  so we can skip this tag pair
                    continue

                # find solutions
                flag_next = False
                quad_list = []
                for s in find_solutions_3_1(tagB1 | tagB2):
                    # add a 4-array to store the card id, each element is a list
                    tmp_quad = [[] for _ in range(4)]
                    for m in range(4):
                        intersection = set(cards_encoded[color_1][s[m][0]]) & set(
                            cards_encoded[color_2][s[m][1]])
                        if not intersection:
                            flag_next = True
                            break
                        else:
                            tmp_quad[m] = intersection

                    # if there is no card, skip this solution
                    if flag_next:
                        flag_next = False
                        continue
                    
                    for quad in product(*tmp_quad):
                        quad_list.append(sorted(quad))

                if not quad_list:
                    # there is no solution, so we can skip this tag pair
                    continue

                # generate the key for the tag pair
                tag_pair_as_key = f"{color_2_tags[i]},{color_2_tags[j]}"

                # Store the results in the corresponding json structure
                # quad_dict
                quad_dict[color_pair_as_key][tag_pair_as_key] = quad_list
                # card0_dict
                card0_dict[color_pair_as_key][tag_pair_as_key] = list(
                    set(tag_cards[str(color_2_tags[i])]) & set(tag_cards[str(color_2_tags[j])]))

    # Save the results to the output directory
    # Generate the full solution by combining the two json structures
    # and save it to the output directory
    cnt = 0
    full_solution = {}
    quint_set = set()
    for color_pair in questions:
        color_1, color_2 = color_pair
        color_pair_as_key = f"{color_1},{color_2}"
        for tag_pair in quad_dict[color_pair_as_key]:
            tag_pair_as_key = f"{color_1_tags[i]},{color_2_tags[j]}"
            for quad in quad_dict[color_pair_as_key][tag_pair]:
                tmp_card0_set = []
                # remove the card0 from tmp_card0_set if sorted(quad+[card0]) is already in full_solution_set
                for card0 in card0_dict[color_pair_as_key][tag_pair]:
                    tmp_quint = tuple(sorted(quad+[card0]))
                    if tmp_quint not in quint_set:
                        tmp_card0_set.append(card0)
                        quint_set.add(tmp_quint)
                if len(tmp_card0_set) == 0:
                    continue
                full_solution[cnt] = {}
                full_solution[cnt]["quad"] = quad
                full_solution[cnt]["card0s"] = tmp_card0_set
                full_solution[cnt]["tags"] = tag_pair
                cnt += 1

    os.makedirs(args.output_dir, exist_ok=True)
    with open(f"{args.output_dir}/full_solution.json", "w") as f:
        json.dump(full_solution, f)
