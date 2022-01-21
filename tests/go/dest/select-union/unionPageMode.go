package da

import (
	"fmt"

	"github.com/mgenware/mingru-go-lib"
)

// TableTypeActivity ...
type TableTypeActivity struct {
}

// Activity ...
var Activity = &TableTypeActivity{}

// MingruSQLName returns the name of this table.
func (mrTable *TableTypeActivity) MingruSQLName() string {
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
func (mrTable *TableTypeActivity) T(queryable mingru.Queryable, id uint64, page int, pageSize int) ([]ActivityTableTResult, bool, error) {
	if page <= 0 {
		err := fmt.Errorf("Invalid page %v", page)
		return nil, false, err
	}
	if pageSize <= 0 {
		err := fmt.Errorf("Invalid page size %v", pageSize)
		return nil, false, err
	}
	limit := pageSize + 1
	offset := (page - 1) * pageSize
	max := pageSize
	rows, err := queryable.Query("(SELECT `id`, `sig` AS `generic_sig`, `url_name` AS `generic_name` FROM `user` WHERE `id` = ? LIMIT ? OFFSET ?) UNION ALL (SELECT `user_id`, `value` FROM `like`) UNION (SELECT `title` FROM `db_post` WHERE `id` = ?) ORDER BY `id` LIMIT ? OFFSET ?", id, limit, offset, id, limit, offset)
	if err != nil {
		return nil, false, err
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
				return nil, false, err
			}
			result = append(result, item)
		}
	}
	err = rows.Err()
	if err != nil {
		return nil, false, err
	}
	return result, itemCounter > len(result), nil
}

// ActivityTableT1Result ...
type ActivityTableT1Result struct {
	GenericName string
	GenericSig  *string
	ID          uint64
}

// T1 ...
func (mrTable *TableTypeActivity) T1(queryable mingru.Queryable, id uint64, page int, pageSize int) ([]ActivityTableT1Result, bool, error) {
	if page <= 0 {
		err := fmt.Errorf("Invalid page %v", page)
		return nil, false, err
	}
	if pageSize <= 0 {
		err := fmt.Errorf("Invalid page size %v", pageSize)
		return nil, false, err
	}
	limit := pageSize + 1
	offset := (page - 1) * pageSize
	max := pageSize
	rows, err := queryable.Query("SELECT `id`, `sig` AS `generic_sig`, `url_name` AS `generic_name` FROM `user` WHERE `id` = ? ORDER BY `id` LIMIT ? OFFSET ?", id, limit, offset)
	if err != nil {
		return nil, false, err
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
				return nil, false, err
			}
			result = append(result, item)
		}
	}
	err = rows.Err()
	if err != nil {
		return nil, false, err
	}
	return result, itemCounter > len(result), nil
}

// ActivityTableT2Result ...
type ActivityTableT2Result struct {
	Title string
}

// T2 ...
func (mrTable *TableTypeActivity) T2(queryable mingru.Queryable, id uint64) ([]ActivityTableT2Result, error) {
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
