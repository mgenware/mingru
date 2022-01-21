package da

import "github.com/mgenware/mingru-go-lib"

// TableTypeActivity ...
type TableTypeActivity struct {
}

// Activity ...
var Activity = &TableTypeActivity{}

// MingruSQLName returns the name of this table.
func (da *TableTypeActivity) MingruSQLName() string {
	return "activity"
}

// ------------ Actions ------------

// ActivityTableTResult ...
type ActivityTableTResult struct {
	GenericName string
	GenericSig  *string
	ID          uint64
}

// T ...
func (da *TableTypeActivity) T(queryable mingru.Queryable, id uint64, limit int, offset int, max int) ([]ActivityTableTResult, int, error) {
	rows, err := queryable.Query("(SELECT `id`, `sig` AS `generic_sig`, `url_name` AS `generic_name` FROM `user` WHERE `id` = ? LIMIT ? OFFSET ?) UNION ALL (SELECT `user_id`, `value` FROM `like`) UNION (SELECT `title` FROM `db_post` WHERE `id` = ?) ORDER BY `id` LIMIT ? OFFSET ?", id, limit, offset, id, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	result := make([]ActivityTableTResult, 0, limit)
	itemCounter := 0
	defer rows.Close()
	for rows.Next() {
		itemCounter++
		if itemCounter <= max {
			var item ActivityTableTResult
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

// ActivityTableT1Result ...
type ActivityTableT1Result struct {
	GenericName string
	GenericSig  *string
	ID          uint64
}

// T1 ...
func (da *TableTypeActivity) T1(queryable mingru.Queryable, id uint64, limit int, offset int, max int) ([]ActivityTableT1Result, int, error) {
	rows, err := queryable.Query("SELECT `id`, `sig` AS `generic_sig`, `url_name` AS `generic_name` FROM `user` WHERE `id` = ? ORDER BY `id` LIMIT ? OFFSET ?", id, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	result := make([]ActivityTableT1Result, 0, limit)
	itemCounter := 0
	defer rows.Close()
	for rows.Next() {
		itemCounter++
		if itemCounter <= max {
			var item ActivityTableT1Result
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

// ActivityTableT2Result ...
type ActivityTableT2Result struct {
	Title string
}

// T2 ...
func (da *TableTypeActivity) T2(queryable mingru.Queryable, id uint64) ([]ActivityTableT2Result, error) {
	rows, err := queryable.Query("SELECT `title` FROM `db_post` WHERE `id` = ? ORDER BY `id`", id)
	if err != nil {
		return nil, err
	}
	var result []ActivityTableT2Result
	defer rows.Close()
	for rows.Next() {
		var item ActivityTableT2Result
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
