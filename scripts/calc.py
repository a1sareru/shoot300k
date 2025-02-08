import argparse
from itertools import combinations, permutations, product
import pandas as pd
import os
import json


def popcount(x):
    return bin(x).count("1")


def get_subsets(mask, k):
    """
    From a given mask, select exactly k bits and return these subsets (as integers)
    """
    bits = [1 << i for i in range(7) if mask & (1 << i)]
    for comb in combinations(bits, k):
        subset = 0
        for bit in comb:
            subset |= bit
        yield subset


def find_solutions_2_2(A, B):
    """
    Parameters:
        A, B: integers, each with exactly one bit set in the low 7 bits.
    Returns:
        solutions: a list of 4-tuples,
                   each 4-tuple is a pair of (first, second) numbers for a card.
    Idea:
        We need to select 2 cards from group0 and 2 cards from group1,
        such that the OR of the first numbers and the OR of the second numbers
        are exactly A and B, respectively.
        We can further prove that:
            - The OR of the first numbers in group0 must have exactly 4 bits set.
            - The OR of the first numbers in group1 must have exactly 2 bits set.
            - The OR of the first numbers in group0, group1, and A must have exactly 7 bits set.
            - The OR of the second numbers in group0 must have exactly 2 bits set.
            - The OR of the second numbers in group1 must have exactly 4 bits set.
            - The OR of the second numbers in group0, group1, and B must have exactly 7 bits set.
    """
    full_mask = 0b1111111  # 127
    # Construct S1 (1-bit numbers) and S2 (2-bit numbers)
    S1 = [1 << i for i in range(7)]
    S2 = []
    for i in range(7):
        for j in range(i+1, 7):
            S2.append((1 << i) | (1 << j))
    # Construct cards: each card is a pair (r, c)
    cards = [(r, c) for r in S1 for c in S2]  # total: 7*21 = 147 cards
    n_cards = len(cards)

    # Enumerate all pairs of cards and classify them by permutation:
    # group0: each card is a pair (c, r)
    # note: it satisfies that popcount(f_mask) == 4 and popcount(s_mask) == 2
    group0 = {}  # key is (f_mask, s_mask)
    for i in range(n_cards):
        r_i, c_i = cards[i]
        for j in range(i+1, n_cards):
            r_j, c_j = cards[j]
            # the first position contribution (2-bit number)
            f_mask = c_i | c_j
            # the second position contribution (1-bit number)
            s_mask = r_i | r_j
            if popcount(f_mask) != 4:
                continue
            if popcount(s_mask) != 2:
                continue
            key = (f_mask, s_mask)
            pair_info = {'indices': (i, j),
                         'assignment': ((c_i, r_i), (c_j, r_j))}
            group0.setdefault(key, []).append(pair_info)

    # group1: each card is a pair (r, c)
    # note: it satisfies that popcount(f_mask) == 2 and popcount(s_mask) == 4
    group1 = {}
    for i in range(n_cards):
        r_i, c_i = cards[i]
        for j in range(i+1, n_cards):
            r_j, c_j = cards[j]
            # the first position contribution (1-bit number)
            f_mask = r_i | r_j
            # the second position contribution (2-bit number)
            s_mask = c_i | c_j
            if popcount(f_mask) != 2:
                continue
            if popcount(s_mask) != 4:
                continue
            key = (f_mask, s_mask)
            pair_info = {'indices': (i, j),
                         'assignment': ((r_i, c_i), (r_j, c_j))}
            group1.setdefault(key, []).append(pair_info)

    solutions = []

    # According to A, the first position requirement is:
    #   A | f0 | f1 = 127.
    # There is only one bit in A,
    #  so the remaining 6 bits must be provided by group0 (4 bits) and group1 (2 bits).
    # Let first_target = 127 ^ A (6 bits), then select all splits into 4+2.
    first_target = full_mask ^ A  # 6 个 bit
    first_splits = []
    for f0 in get_subsets(first_target, 4):
        f1 = first_target ^ f0  # f1 is 2-bit number
        if popcount(f1) != 2:
            continue
        first_splits.append((f0, f1))

    # Respectively, the second position requirement is:
    #   B | s0 | s1 = 127.
    # Let second_target = 127 ^ B (6 bits), then select all splits into 2+4.
    second_target = full_mask ^ B  # 6 bit
    second_splits = []
    for s0 in get_subsets(second_target, 2):
        s1 = second_target ^ s0  # s1 is 4-bit number
        if popcount(s1) != 4:
            continue
        second_splits.append((s0, s1))

    # Now, for each "bit split" group,
    #  from group0, find the pair with the first position or = f0 and the second position or = s0,
    #  and from group1, find the pair with the first position or = f1 and the second position or = s1,
    # Then merge a pair of group0 pairs with a pair of group1 pairs,
    #  if the cards they use are not duplicated, they form a solution.
    for (f0, f1) in first_splits:
        for (s0, s1) in second_splits:
            key0 = (f0, s0)
            key1 = (f1, s1)
            if key0 not in group0 or key1 not in group1:
                continue
            for pair0 in group0[key0]:
                indices0 = set(pair0['indices'])
                for pair1 in group1[key1]:
                    indices1 = set(pair1['indices'])
                    if indices0 & indices1:  # if there are common cards, continue
                        continue
                    # merge the two pairs to form a solution, orderless
                    sol = list(pair0['assignment']) + list(pair1['assignment'])
                    solutions.append(sol)

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
    # get SSR cards
    df_ssr = df_cards[df_cards['rarity'] == 4]
    ssr_cards = list(df_ssr['id'])
    # add SR(177, 866, 867) as SSR, since they provide 3 normal silver tags
    ssr_cards.extend([177, 866, 867])
    ssr_cards = sorted(ssr_cards)
    # delete SSR(129-132) from SSR list, since they only provide 2 normal silver tags
    ssr_cards = [c for c in ssr_cards if c not in range(129, 133)]
    ssr_cards = tuple(ssr_cards)

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
                        if not intersection:
                            flag_next = True
                            break
                        else:
                            quad[m] = intersection

                    # if there is no card, skip this solution
                    if flag_next:
                        flag_next = False
                        continue
                    quad_list.append(quad)

                if not quad_list:
                    # there is no solution, so we can skip this tag pair
                    continue

                # expand the quad list
                expanded_quads = [list(product(*quad)) for quad in quad_list]

                # generate the key for the tag pair
                tag_pair_as_key = f"{color_1_tags[i]},{color_2_tags[j]}"

                # Store the results in the corresponding json structure
                # quad_dict: flatten it before storing
                quad_dict[color_pair_as_key][tag_pair_as_key] = [
                    tup for sublist in expanded_quads for tup in sublist]
                # card0_dict
                card0_dict[color_pair_as_key][tag_pair_as_key] = list(
                    set(tag_cards[str(color_1_tags[i])]) & set(tag_cards[str(color_2_tags[j])]))

        # Note:
        #  The following break statements are used for testing purposes.
        #  Therefore, they should be removed when the script is used in production.
        #         break  # test one tag pair for now [loop j]
        #     break  # test one tag pair for now [loop i]
        # break  # test one color pair for now

    # Save the results to the output directory
    os.makedirs(args.output_dir, exist_ok=True)
    with open(f"{args.output_dir}/card0.json", "w") as f:
        json.dump(card0_dict, f, indent=4)
    with open(f"{args.output_dir}/quad.json", "w") as f:
        json.dump(quad_dict, f, indent=4)
