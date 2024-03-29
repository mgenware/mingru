package da

import "github.com/mgenware/mingru-go-lib"

type GhostAGType struct {
}

var Ghost = &GhostAGType{}

// ------------ Actions ------------

func (mrTable *GhostAGType) InsertT(mrQueryable mingru.Queryable, fk uint64) error {
	_, err := mrQueryable.Exec("INSERT INTO `cols` (`text`, `int`, `nullable`, `def_int`, `def_var_char`, `def_time`, `fk`) VALUES ('', 0, NULL, -3, '一二', CURTIME(), ?)", fk)
	return err
}

type GhostAGSelectTResult struct {
	ID    uint64
	Title string
}

func (mrTable *GhostAGType) SelectT(mrQueryable mingru.Queryable) ([]GhostAGSelectTResult, error) {
	rows, err := mrQueryable.Query("SELECT `id`, `title` FROM `db_post` ORDER BY `id`")
	if err != nil {
		return nil, err
	}
	var result []GhostAGSelectTResult
	defer rows.Close()
	for rows.Next() {
		var item GhostAGSelectTResult
		err = rows.Scan(&item.ID, &item.Title)
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
