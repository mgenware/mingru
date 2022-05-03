package da

import "github.com/mgenware/mingru-go-lib"

type ActivityAGType struct {
}

var Activity = &ActivityAGType{}

// ------------ Actions ------------

type ActivityAGTResult struct {
	GenericName string
	GenericSig  *string
	ID          uint64
}

func (mrTable *ActivityAGType) T(mrQueryable mingru.Queryable, id uint64, limit int, offset int, max int) ([]ActivityAGTResult, int, error) {
	rows, err := mrQueryable.Query("(SELECT `id`, `sig` AS `generic_sig`, `url_name` AS `generic_name` FROM `user` WHERE `id` = ? LIMIT ? OFFSET ?) UNION ALL (SELECT `user_id`, `value` FROM `like`) UNION (SELECT `title` FROM `db_post` WHERE `id` = ?) ORDER BY `id` LIMIT ? OFFSET ?", id, limit, offset, id, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	result := make([]ActivityAGTResult, 0, limit)
	itemCounter := 0
	defer rows.Close()
	for rows.Next() {
		itemCounter++
		if itemCounter <= max {
			var item ActivityAGTResult
			err = rows.Scan(&item.ID, &item.GenericSig, &item.GenericName)
			if err != nil {
				return nil, 0, err
			}
			result = append(result, item)
		}
	}
	err = rows.Err()
	if err != nil {
		return nil, 0, err
	}
	return result, itemCounter, nil
}

type ActivityAGT1Result struct {
	GenericName string
	GenericSig  *string
	ID          uint64
}

func (mrTable *ActivityAGType) T1(mrQueryable mingru.Queryable, id uint64, limit int, offset int, max int) ([]ActivityAGT1Result, int, error) {
	rows, err := mrQueryable.Query("SELECT `id`, `sig` AS `generic_sig`, `url_name` AS `generic_name` FROM `user` WHERE `id` = ? ORDER BY `id` LIMIT ? OFFSET ?", id, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	result := make([]ActivityAGT1Result, 0, limit)
	itemCounter := 0
	defer rows.Close()
	for rows.Next() {
		itemCounter++
		if itemCounter <= max {
			var item ActivityAGT1Result
			err = rows.Scan(&item.ID, &item.GenericSig, &item.GenericName)
			if err != nil {
				return nil, 0, err
			}
			result = append(result, item)
		}
	}
	err = rows.Err()
	if err != nil {
		return nil, 0, err
	}
	return result, itemCounter, nil
}

type ActivityAGT2Result struct {
	Title string
}

func (mrTable *ActivityAGType) T2(mrQueryable mingru.Queryable, id uint64) ([]ActivityAGT2Result, error) {
	rows, err := mrQueryable.Query("SELECT `title` FROM `db_post` WHERE `id` = ? ORDER BY `id`", id)
	if err != nil {
		return nil, err
	}
	var result []ActivityAGT2Result
	defer rows.Close()
	for rows.Next() {
		var item ActivityAGT2Result
		err = rows.Scan(&item.Title)
		if err != nil {
			return nil, err
		}
		result = append(result, item)
	}
	err = rows.Err()
	if err != nil {
		return nil, err
	}
	return result, nil
}
