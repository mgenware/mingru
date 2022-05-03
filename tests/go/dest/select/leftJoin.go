package da

import "github.com/mgenware/mingru-go-lib"

type PostAGType struct {
}

var Post = &PostAGType{}

// ------------ Actions ------------

func (mrTable *PostAGType) Field(mrQueryable mingru.Queryable) (*string, error) {
	var result *string
	err := mrQueryable.QueryRow("SELECT `join_1`.`url_name` FROM `db_post` AS `db_post` LEFT JOIN `user` AS `join_1` ON `join_1`.`id` = `db_post`.`user_id`").Scan(&result)
	if err != nil {
		return result, err
	}
	return result, nil
}

func (mrTable *PostAGType) FieldRows(mrQueryable mingru.Queryable) ([]*string, error) {
	rows, err := mrQueryable.Query("SELECT `join_1`.`url_name` FROM `db_post` AS `db_post` LEFT JOIN `user` AS `join_1` ON `join_1`.`id` = `db_post`.`user_id`")
	if err != nil {
		return nil, err
	}
	var result []*string
	defer rows.Close()
	for rows.Next() {
		var item *string
		err = rows.Scan(&item)
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

type PostAGRowResult struct {
	ID          uint64
	UserUrlName *string
}

func (mrTable *PostAGType) Row(mrQueryable mingru.Queryable, id uint64) (PostAGRowResult, error) {
	var result PostAGRowResult
	err := mrQueryable.QueryRow("SELECT `join_1`.`url_name`, `db_post`.`id` FROM `db_post` AS `db_post` LEFT JOIN `user` AS `join_1` ON `join_1`.`id` = `db_post`.`user_id` WHERE `db_post`.`id` = ?", id).Scan(&result.UserUrlName, &result.ID)
	if err != nil {
		return result, err
	}
	return result, nil
}

type PostAGRowsResult struct {
	ID          uint64
	UserUrlName *string
}

func (mrTable *PostAGType) Rows(mrQueryable mingru.Queryable) ([]PostAGRowsResult, error) {
	rows, err := mrQueryable.Query("SELECT `join_1`.`url_name`, `db_post`.`id` FROM `db_post` AS `db_post` LEFT JOIN `user` AS `join_1` ON `join_1`.`id` = `db_post`.`user_id`")
	if err != nil {
		return nil, err
	}
	var result []PostAGRowsResult
	defer rows.Close()
	for rows.Next() {
		var item PostAGRowsResult
		err = rows.Scan(&item.UserUrlName, &item.ID)
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
